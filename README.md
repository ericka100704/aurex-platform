# AUREX

Luxury Online Investment Platform scaffold built with **Next.js (App Router, JavaScript)**, **Tailwind CSS**, **Framer Motion**, and **PostgreSQL via Prisma**.

**Trade · Grow · Succeed**

## Brand

| Token | Value |
|-------|-------|
| Gold | `#D4AF37` |
| Rose Pink | `#FF69B4` |
| Dark | `#0D0D0D` |

## Quick Start

```bash
# 1. Install
npm install

# 2. Environment
cp .env.example .env
# Set DATABASE_URL to your Supabase/Postgres connection string

# 3. Database
npx prisma generate
npx prisma db push
npm run db:seed

# 4. Dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

| Surface | URL |
|---------|-----|
| Landing | `/` |
| User Dashboard | `/dashboard` |
| Admin Dashboard | `/admin` |

### Seed accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@aurex.app` | `admin123` |
| User | `demo@aurex.app` | `user123` |

> Auth, dashboards, deposits, investments, withdrawals, and admin CRUD are wired to Prisma/Supabase.

## Folder Structure

```
Online Investment Platform/
├── prisma/
│   ├── schema.prisma      # Prisma models
│   ├── schema.sql         # Raw PostgreSQL alternative
│   └── seed.js
├── public/uploads/
├── src/
│   ├── app/
│   │   ├── admin/         # Admin dashboard pages
│   │   ├── api/           # API route stubs
│   │   ├── dashboard/     # User dashboard pages
│   │   ├── login/
│   │   ├── register/
│   │   ├── globals.css
│   │   ├── layout.js
│   │   └── page.js
│   ├── components/
│   │   ├── admin/
│   │   ├── dashboard/
│   │   ├── layout/
│   │   └── ui/
│   ├── constants/
│   ├── lib/
│   └── middleware.js
├── tailwind.config.js
└── package.json
```

## Database Models

`User` · `Plan` · `Investment` · `DepositMethod` · `Deposit` · `Withdrawal` · `Referral` · `SystemSetting`

## Default Plans

| Plan | Duration | Min Deposit | Return |
|------|----------|-------------|--------|
| AUREX START | 8 days | ₱300 | 25% total |
| AUREX PRO | 15 days | ₱3,000 | 50% total |
| AUREX ELITE | 25 days | ₱6,000 | 4% daily |

## API Stubs

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/plans` | Active plans |
| CRUD | `/api/admin/plans` | Admin plan management |
| POST | `/api/deposits` | Submit deposit + proof |
| POST | `/api/withdrawals` | Request withdrawal |
| POST | `/api/investments` | Invest from balance |
| GET/PUT | `/api/admin/settings` | Referral & withdrawal rules |
| POST | `/api/admin/approvals` | Approve/reject queues |

## Next Implementation Steps

1. Connect `DATABASE_URL` and run Prisma migrate/push + seed.
2. Implement login/register against `User` + JWT cookies in `src/lib/auth.js`.
3. Replace `src/lib/mock-data.js` usage with Prisma queries in pages/API.
4. Add receipt upload (local `/public/uploads` or Supabase Storage).
5. Enforce role checks in `middleware.js` for `/admin/*`.
6. Cron/job for daily ROI credit on active investments.
