# Vercel env checklist (aurex.click)

Paste values in **Vercel → Project → Settings → Environment Variables**.  
Do **not** commit `.env`. Do **not** paste secrets into GitHub or chat.

After any `NEXT_PUBLIC_*` change: **Deployments → Redeploy**.

Use **Production** (and Preview if you test preview URLs).

---

## Required

Copy from local `.env` unless noted.

- [ ] `NEXT_PUBLIC_APP_URL` = `https://www.aurex.click`
- [ ] `NEXT_PUBLIC_APP_NAME` = `AUREX`
- [ ] `DATABASE_URL` — Supabase pooler (`:6543`, `?pgbouncer=true`)
- [ ] `DIRECT_URL` — Supabase direct (`:5432`)
- [ ] `JWT_SECRET` — long random; **not** `change-me-to-a-long-random-secret`
- [ ] `CRON_SECRET` — long random (Vercel cron sends `Authorization: Bearer CRON_SECRET` to `/api/cron/roi`)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` — `https://YOUR_PROJECT.supabase.co`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` — Supabase **service_role** (secret). Never the anon/public key.

## Optional

- [ ] `RESEND_API_KEY` — without this, verify / forgot-password emails will not send on production
- [ ] `MAIL_FROM` — e.g. `AUREX <noreply@aurex.click>` (domain must be verified in Resend)
- [ ] `PAYMONGO_SECRET_KEY` — leave empty for manual receipt deposits
- [ ] `PAYMONGO_WEBHOOK_SECRET` — only if PayMongo webhooks are enabled  
  Webhook URL: `https://www.aurex.click/api/webhooks/paymongo`  
  Event: `checkout_session.payment.paid`

---

## After save

1. Redeploy Production.
2. Hard-refresh https://www.aurex.click
3. Smoke test: login, deposit receipt upload, profile photo, withdraw (GCash number), admin Investments.
4. Confirm cron: Vercel **Settings → Crons** (Hobby may not run crons). Fallback: Admin → Settings → Run daily ROI now.

## If something breaks

| Symptom | Likely missing |
|---|---|
| Login / JWT error | `JWT_SECRET` |
| DB / Prisma errors | `DATABASE_URL` / `DIRECT_URL` |
| No ROI at midnight Manila | `CRON_SECRET` or cron not enabled |
| Receipt / avatar upload fails | Supabase URL + service_role |
| No verify / reset emails | `RESEND_API_KEY` + `MAIL_FROM` |
| Verify links go to localhost | `NEXT_PUBLIC_APP_URL` |
