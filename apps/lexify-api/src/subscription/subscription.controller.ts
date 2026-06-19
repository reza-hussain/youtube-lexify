import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Headers,
  Req,
  UseGuards,
  Request,
  HttpCode,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  /** GET /subscription/status — returns tier + daily quota for the logged-in user */
  @Get('status')
  @UseGuards(JwtAuthGuard)
  getStatus(@Request() req: any) {
    return this.subscriptionService.getStatus(req.user.id);
  }

  /** POST /subscription/checkout — creates a Stripe Checkout session */
  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  async checkout(@Request() req: any, @Body() body: { priceId: string; successUrl: string; cancelUrl: string }) {
    return this.subscriptionService.createCheckoutSession(
      req.user.id,
      req.user.email,
      body.priceId,
      body.successUrl,
      body.cancelUrl,
    );
  }

  /** GET /subscription/details — full subscription info for the management UI */
  @Get('details')
  @UseGuards(JwtAuthGuard)
  getDetails(@Request() req: any) {
    return this.subscriptionService.getDetails(req.user.id);
  }

  /** DELETE /subscription — cancel at end of current period */
  @Delete()
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  cancel(@Request() req: any) {
    return this.subscriptionService.cancelAtPeriodEnd(req.user.id);
  }

  /** POST /subscription/reactivate — undo cancel_at_period_end */
  @Post('reactivate')
  @UseGuards(JwtAuthGuard)
  reactivate(@Request() req: any) {
    return this.subscriptionService.reactivate(req.user.id);
  }

  /** POST /subscription/razorpay-subscribe — creates a Razorpay subscription */
  @Post('razorpay-subscribe')
  @UseGuards(JwtAuthGuard)
  razorpaySubscribe(@Request() req: any, @Body() body: { planId: string }) {
    return this.subscriptionService.createRazorpaySubscription(req.user.id, body.planId);
  }

  /** POST /subscription/razorpay-verify — verifies payment and activates Pro */
  @Post('razorpay-verify')
  @UseGuards(JwtAuthGuard)
  razorpayVerify(
    @Request() req: any,
    @Body() body: { subscriptionId: string; paymentId: string; signature: string },
  ) {
    return this.subscriptionService.verifyRazorpayPayment(
      req.user.id,
      body.subscriptionId,
      body.paymentId,
      body.signature,
    );
  }

  /** POST /subscription/portal — creates a Stripe Customer Portal session */
  @Post('portal')
  @UseGuards(JwtAuthGuard)
  async portal(@Request() req: any, @Body() body: { returnUrl: string }) {
    return this.subscriptionService.createPortalSession(req.user.id, body.returnUrl);
  }

  /** POST /subscription/webhook — Stripe webhook (no auth, raw body required) */
  @Post('webhook')
  @HttpCode(200)
  async webhook(
    @Req() req: any,
    @Headers('stripe-signature') sig: string,
  ) {
    return this.subscriptionService.handleWebhook(req.rawBody!, sig);
  }
}
