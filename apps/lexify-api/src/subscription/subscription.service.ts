import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import Stripe from 'stripe';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

// Minimal structural types for Stripe objects used in webhook handlers
interface StripeSub {
  id: string;
  status: string;
  customer: string | { id: string };
}
interface StripeInvoice {
  id: string;
  customer: string | { id: string } | null;
  amount_paid?: number;
  currency?: string;
}

@Injectable()
export class SubscriptionService {
  private stripe: InstanceType<typeof Stripe>;
  private _razorpay: InstanceType<typeof Razorpay> | null = null;

  private get razorpay(): InstanceType<typeof Razorpay> {
    if (!this._razorpay) {
      this._razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID!,
        key_secret: process.env.RAZORPAY_KEY_SECRET!,
      });
    }
    return this._razorpay;
  }

  constructor(private readonly prisma: PrismaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2026-03-25.dahlia',
    });
  }

  /** Create a Stripe Checkout session for a new subscription. */
  async createCheckoutSession(
    userId: string,
    email: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string,
  ) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    // Reuse existing Stripe customer or create one
    let customerId = user.stripeCustomerId ?? undefined;
    if (!customerId) {
      const customer = await this.stripe.customers.create({ email, metadata: { userId } });
      customerId = customer.id;
      await this.prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      });
    }

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: { metadata: { userId } },
    });

    return { url: session.url };
  }

  /** Create a Stripe Customer Portal session for managing/canceling. */
  async createPortalSession(userId: string, returnUrl: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.stripeCustomerId) {
      throw new NotFoundException('No billing account found');
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: returnUrl,
    });

    return { url: session.url };
  }

  /** Get current subscription status for a user. */
  async getStatus(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        subscriptionTier: true,
        subscriptionStatus: true,
        dailyLookupCount: true,
        dailyLookupResetAt: true,
      },
    });

    const today = new Date();
    const resetDate = new Date(user.dailyLookupResetAt);
    const isNewDay =
      today.getUTCFullYear() !== resetDate.getUTCFullYear() ||
      today.getUTCMonth() !== resetDate.getUTCMonth() ||
      today.getUTCDate() !== resetDate.getUTCDate();

    const count = isNewDay ? 0 : user.dailyLookupCount;
    const limit = user.subscriptionTier === 'PRO' ? null : 30;

    return {
      tier: user.subscriptionTier,
      status: user.subscriptionStatus,
      dailyLookupCount: count,
      dailyLimit: limit,
      remaining: limit === null ? null : Math.max(0, limit - count),
    };
  }

  /** Get full subscription details for the management UI (Stripe or Razorpay). */
  async getDetails(userId: string): Promise<{
    tier: string;
    status: string;
    subscription: {
      id: string;
      stripeStatus: string;
      cancelAtPeriodEnd: boolean;
      currentPeriodEnd: string | null;
      planName: string;
      amount: number | null;
      currency: string;
    } | null;
  }> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        subscriptionTier: true,
        subscriptionStatus: true,
        stripeSubscriptionId: true,
        razorpaySubscriptionId: true,
      },
    });

    if (user.subscriptionTier !== 'PRO') {
      return { tier: user.subscriptionTier, status: user.subscriptionStatus, subscription: null };
    }

    // ── Stripe subscription ──────────────────────────────────────────────────
    if (user.stripeSubscriptionId) {
      const sub = await this.stripe.subscriptions.retrieve(user.stripeSubscriptionId, {
        expand: ['items.data.price'],
      });

      const item = sub.items.data[0];
      const price = item?.price;
      const interval = price?.recurring?.interval ?? 'month';
      const periodEnd = item?.current_period_end ?? sub.cancel_at ?? null;

      return {
        tier: user.subscriptionTier,
        status: user.subscriptionStatus,
        subscription: {
          id: sub.id,
          stripeStatus: sub.status,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
          currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
          planName: interval === 'year' ? 'Annual' : 'Monthly',
          amount: price?.unit_amount ? price.unit_amount / 100 : null,
          currency: price?.currency?.toUpperCase() ?? 'USD',
        },
      };
    }

    // ── Razorpay subscription ────────────────────────────────────────────────
    if (user.razorpaySubscriptionId) {
      const sub = await this.razorpay.subscriptions.fetch(user.razorpaySubscriptionId) as any;
      const plan = await this.razorpay.plans.fetch(sub.plan_id) as any;
      const currentEnd: number | null = sub.current_end ?? sub.charge_at ?? null;
      const isAnnual = String(sub.plan_id) === process.env.RAZORPAY_PLAN_ID_ANNUAL;
      // plan.item.amount is in paise — divide by 100 for rupees
      const amount = plan?.item?.amount != null ? plan.item.amount / 100 : null;

      return {
        tier: user.subscriptionTier,
        status: user.subscriptionStatus,
        subscription: {
          id: sub.id,
          stripeStatus: sub.status,
          cancelAtPeriodEnd: sub.status === 'cancelled',
          currentPeriodEnd: currentEnd ? new Date(currentEnd * 1000).toISOString() : null,
          planName: isAnnual ? 'Annual' : 'Monthly',
          amount,
          currency: (plan?.item?.unit ?? 'INR').toUpperCase(),
        },
      };
    }

    // PRO tier but no subscription record (edge case)
    return { tier: user.subscriptionTier, status: user.subscriptionStatus, subscription: null };
  }

  /** Cancel subscription at end of current billing period. */
  async cancelAtPeriodEnd(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { stripeSubscriptionId: true, razorpaySubscriptionId: true },
    });

    if (user.stripeSubscriptionId) {
      await this.stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
      return { ok: true };
    }

    if (user.razorpaySubscriptionId) {
      await (this.razorpay.subscriptions as any).cancel(user.razorpaySubscriptionId, true);
      return { ok: true };
    }

    throw new NotFoundException('No active subscription');
  }

  /** Reactivate a subscription that was set to cancel at period end. */
  async reactivate(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { stripeSubscriptionId: true, razorpaySubscriptionId: true },
    });

    if (user.stripeSubscriptionId) {
      await this.stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: false,
      });
      return { ok: true };
    }

    // Razorpay doesn't support un-cancelling; inform the user
    if (user.razorpaySubscriptionId) {
      throw new BadRequestException('Razorpay subscriptions cannot be reactivated once scheduled for cancellation. Please subscribe again after the current period ends.');
    }

    throw new NotFoundException('No active subscription');
  }

  /** Create a Razorpay subscription and return the details needed by the frontend. */
  async createRazorpaySubscription(userId: string, planId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { name: true, email: true },
    });

    const isAnnual = planId === process.env.RAZORPAY_PLAN_ID_ANNUAL;
    const subscription = await this.razorpay.subscriptions.create({
      plan_id: planId,
      total_count: isAnnual ? 10 : 120, // 10 years for annual, 10 years for monthly
      quantity: 1,
      customer_notify: 1,
    });

    return {
      subscriptionId: subscription.id,
      keyId: process.env.RAZORPAY_KEY_ID,
      prefill: { name: user.name ?? '', email: user.email },
    };
  }

  /** Verify Razorpay payment signature and activate the subscription. */
  async verifyRazorpayPayment(
    userId: string,
    razorpaySubscriptionId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
  ) {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) throw new BadRequestException('Razorpay not configured');

    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${razorpayPaymentId}|${razorpaySubscriptionId}`)
      .digest('hex');

    if (expected !== razorpaySignature) {
      throw new BadRequestException('Invalid payment signature');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionTier: 'PRO',
        subscriptionStatus: 'ACTIVE',
        razorpaySubscriptionId,
      },
    });

    await this.prisma.revenueEvent.create({
      data: {
        userId,
        amount: 0,
        eventType: 'SUBSCRIPTION_CREATED',
        stripeId: `rzp_${razorpayPaymentId}_${Date.now()}`,
      },
    });

    return { ok: true };
  }

  /** Handle incoming Stripe webhook events. */
  async handleWebhook(rawBody: Buffer, signature: string) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new BadRequestException('Webhook secret not configured');

    let event: ReturnType<typeof this.stripe.webhooks.constructEvent>;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, secret);
    } catch {
      throw new BadRequestException('Invalid webhook signature');
    }

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        await this.syncSubscription(event.data.object as StripeSub);
        break;
      }
      case 'customer.subscription.deleted': {
        await this.cancelSubscription(event.data.object as StripeSub);
        break;
      }
      case 'invoice.payment_succeeded': {
        await this.recordRevenueEvent(event.data.object as StripeInvoice, 'PAYMENT_SUCCESS');
        break;
      }
      case 'invoice.payment_failed': {
        await this.recordRevenueEvent(event.data.object as StripeInvoice, 'PAYMENT_FAILED');
        break;
      }
    }

    return { received: true };
  }

  private async syncSubscription(sub: StripeSub) {
    const customerId =
      typeof sub.customer === 'string' ? sub.customer : sub.customer.id;

    const user = await this.prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
    });
    if (!user) return;

    const isActive = sub.status === 'active' || sub.status === 'trialing';
    const statusMap: Record<string, 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'NONE'> = {
      active: 'ACTIVE',
      trialing: 'ACTIVE',
      canceled: 'CANCELED',
      past_due: 'PAST_DUE',
    };

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionTier: isActive ? 'PRO' : 'FREE',
        subscriptionStatus: statusMap[sub.status] ?? 'NONE',
        stripeSubscriptionId: sub.id,
      },
    });

    await this.prisma.revenueEvent.create({
      data: {
        userId: user.id,
        amount: 0,
        eventType: 'SUBSCRIPTION_CREATED',
        stripeId: `sub_sync_${sub.id}_${Date.now()}`,
      },
    });
  }

  private async cancelSubscription(sub: StripeSub) {
    const customerId =
      typeof sub.customer === 'string' ? sub.customer : sub.customer.id;

    const user = await this.prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
    });
    if (!user) return;

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionTier: 'FREE',
        subscriptionStatus: 'CANCELED',
      },
    });
  }

  private async recordRevenueEvent(invoice: StripeInvoice, eventType: string) {
    const customerId =
      typeof invoice.customer === 'string' ? invoice.customer : (invoice.customer as any)?.id;
    if (!customerId) return;

    const user = await this.prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
    });
    if (!user) return;

    await this.prisma.revenueEvent.upsert({
      where: { stripeId: invoice.id },
      update: {},
      create: {
        userId: user.id,
        amount: (invoice.amount_paid ?? 0) / 100,
        currency: invoice.currency?.toUpperCase() ?? 'USD',
        eventType,
        stripeId: invoice.id,
      },
    });
  }
}
