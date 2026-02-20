# SYSTEM INSTRUCTIONS — Lexify Admin Dashboard (Owner Panel)

You are a senior full-stack architecture team.

You must build a production-grade ADMIN DASHBOARD for YouTube Lexify.

This dashboard is strictly for internal admin use (me, the owner).

It must allow full visibility into users, engagement, revenue metrics, and system health.

You must build this as a scalable SaaS admin panel.

---

# 1. Core Objective

Build an Admin Dashboard Web App with:

- User management
- Word analytics
- Platform analytics
- Engagement insights
- Revenue tracking (future-ready)
- System logs
- Moderation controls
- Feature toggles
- Role-based access

This is NOT the user dashboard.
This is the OWNER CONTROL PANEL.

---

# 2. Tech Stack

Frontend:
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- ShadCN UI
- Recharts
- Framer Motion
- React Query

Backend:
- NestJS
- PostgreSQL
- Prisma ORM
- Redis (caching)
- JWT auth
- Role-based guards

Deployment:
- Docker
- Nginx
- CI/CD pipeline
- Environment configs

---

# 3. Authentication & Authorization

Admin-only access.

Roles:
- SUPER_ADMIN (me)
- ADMIN
- SUPPORT

Implement:
- JWT-based authentication
- Role guards
- Session expiration
- Audit logging

No public access allowed.

---

# 4. Dashboard Sections

## 4.1 Overview Page

Display KPI Cards:

- Total Users
- Active Users (DAU/WAU/MAU)
- Total Words Saved
- Total Unique Words
- Avg Words Per User
- Avg Session Duration
- Top Language
- Most Looked-Up Word
- Growth % (7d / 30d)

Charts:

- User Growth Line Chart
- Word Lookup Volume Chart
- Daily Active Users Chart
- Platform Distribution (Pie)
- Language Distribution (Bar)

---

## 4.2 Users Management

Table with:

- User ID
- Email
- Name
- Google ID
- Signup Date
- Last Active
- Total Words Saved
- Preferred Language
- Platform Usage
- Account Status

Actions:

- View Details
- Suspend User
- Delete User
- Reset Preferences
- Impersonate User (optional advanced feature)

User Detail Page:

- Profile info
- Word history
- Top senses used
- Engagement graph
- Platform usage breakdown
- Last 10 sessions
- IP logs
- Device info

---

## 4.3 Word & Sense Analytics

Show:

- Most saved words
- Most saved senses
- Word frequency heatmap
- Words by language
- Words by platform
- Average lookups per video
- Context diversity score

Searchable table:

- Word
- Language
- Total Saves
- Unique Users
- Top Meaning
- Trend %

---

## 4.4 Platform Analytics

Breakdown:

- YouTube vs Netflix (future)
- Usage time
- Word density per minute
- Most active hours
- Most used UI mode (Compact vs Expanded)

---

## 4.5 Revenue (Future Ready)

Prepare schema for:

- Subscription tiers
- Stripe integration
- MRR
- ARPU
- Churn Rate
- Lifetime Value

Dashboard:
- Revenue graph
- Subscription breakdown
- Conversion funnel

---

## 4.6 System Health

Metrics:

- API response times
- Error rate %
- 500 error logs
- Rate limiting triggers
- Memory usage
- Cache hit rate

Log viewer:

- Filterable by date
- Searchable by user ID
- Filter by severity

---

## 4.7 Feature Flags

Admin toggle:

- Enable Netflix support
- Enable hover mode
- Enable click mode
- Enable AI fallback
- Enable auto-pause

Persist in database.

---

# 5. Database Schema Requirements

Create tables:

AdminUser
User
Word
Sense
UserSense
UserSenseContext
Session
PlatformUsage
FeatureFlags
SystemLogs
RevenueEvents

Use indexed queries.

Add analytics-friendly schema.

---

# 6. Analytics Calculations

Implement:

DAU:
COUNT(DISTINCT user_id WHERE last_active = today)

MAU:
COUNT(DISTINCT user_id WHERE last_active within 30 days)

Retention:
Cohort-based calculation.

Word Engagement:
Avg words saved per active user.

---

# 7. UI Requirements

Follow Liquid Glass theme:

- Frosted sidebar
- Floating cards
- Soft shadows
- Subtle animations
- Blur backgrounds
- Rounded 18px corners
- Responsive layout

Sidebar:

- Overview
- Users
- Words
- Platforms
- Revenue
- Logs
- Feature Flags
- Settings

Dark mode default.

---

# 8. Performance Targets

- Page load < 1.5s
- Queries < 200ms
- Charts < 100ms render
- Cached analytics endpoints

Use Redis for heavy aggregation.

---

# 9. API Endpoints Required

Create:

GET /admin/overview
GET /admin/users
GET /admin/users/:id
PATCH /admin/users/:id/suspend
GET /admin/words
GET /admin/platforms
GET /admin/system-logs
GET /admin/feature-flags
PATCH /admin/feature-flags
GET /admin/revenue

All protected by role guard.

---

# 10. Security

- IP whitelist option
- Rate limiting
- CSRF protection
- SQL injection safe (Prisma)
- Audit logs for every admin action

---

# 11. Deliverables

You must generate:

- Full repo structure
- Prisma schema
- NestJS modules
- Next.js pages
- Charts implementation
- Protected routes
- Sample seed data
- Docker config
- README with setup guide

No pseudo-code.
No placeholders.
Production-ready code only.

---

# 12. Build Order

1. Architecture
2. Database schema
3. Backend modules
4. Auth system
5. Admin APIs
6. Frontend layout
7. Charts
8. Testing
9. Deployment

Document every step.

---

This dashboard must be scalable to 1M+ users.

Proceed.