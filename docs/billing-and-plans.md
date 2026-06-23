# Billing and Plans

## Status

No payment gateway is integrated. Plan enforcement is application-level only.
Upgrading a physician's plan requires a direct database UPDATE until a gateway is wired.

---

## Plans

| Plan         | DB value       | Max compositions | Calculations | History    |
|---|---|---|---|---|
| Gratuito     | `free`         | 4                | 5/month*     | 7 days*    |
| Profissional | `professional` | unlimited        | unlimited    | full       |
| Equipe       | `team`         | unlimited        | unlimited    | full       |

\* Monthly calculation limit and history truncation are **documented but not yet enforced** — see Limits section below.

---

## What is implemented

### Database (migration 022)
- `physician_accounts.plan_type TEXT NOT NULL DEFAULT 'free'`
- `physician_accounts.subscription_status TEXT NOT NULL DEFAULT 'inactive'`
- Existing rows were backfilled to `'free'` / `'inactive'` at migration time.

### Backend (backend/internal/billing/plans.go)
- `PlanType` constants: `free`, `professional`, `team`
- `SubscriptionStatus` constants: `inactive`, `active`, `past_due`, `canceled`
- `GetLimits(plan PlanType) Limits` — returns `MaxCompositions` per plan
- `IsUnlimited(limit int) bool` — true when limit == 0

### Repository
- `CountCompositionsByPhysician(physicianID string) (int, error)` — implemented in both `PostgresRepository` and `FileRepository`

### Handler enforcement
- `POST /api/compositions` checks the composition count against the plan limit before saving
- Free plan (4 composition cap): returns `HTTP 403` with body `{"error":"plan_limit_reached","message":"O plano gratuito permite até 4 composições salvas."}`
- Professional/Team: no composition limit

### Auth context
- `MakeClerkAuthMiddleware` and `MakeTestAuthMiddleware` now store the full `PhysicianAccount` in the request context (previously only the physician UUID was stored)
- `physicianAccountFromContext(ctx)` is available to all handlers

---

## What is NOT implemented

| Feature | Why deferred |
|---|---|
| Monthly calculation limit | Calculation save is not consistently tied to authenticated physician; blocking stateless calculations requires explicit product decision |
| History truncation (7 days) | No query or job exists for this; requires scheduled cleanup or read-time filtering |
| Plan upgrade flow | No gateway configured; upgrades require manual DB UPDATE |
| Payment gateway | Out of scope — requires Stripe/Pagar.me/MercadoPago integration and product decision |
| Checkout modal | Deferred until gateway exists |
| Team multi-user management | Team plan is a placeholder; no multi-user or permission model exists yet |

---

## How to upgrade a physician's plan manually

```sql
UPDATE physician_accounts
SET plan_type = 'professional', subscription_status = 'active', updated_at = now()
WHERE clerk_user_id = '<clerk_user_id>';
```

---

## Next steps for real subscription

1. Choose a gateway (Stripe recommended for international; Pagar.me for BR acquirers).
2. Create a `subscriptions` table referencing `physician_accounts` with gateway subscription IDs.
3. Implement a webhook handler to update `plan_type` and `subscription_status` on payment events.
4. Wire the checkout flow on the frontend (separate from landing pricing section).
5. Add monthly calculation counting (requires a `calculations_monthly_usage` table or a DB function).
6. Implement history truncation (either a scheduled job or a read-time `WHERE created_at > now() - INTERVAL '7 days'`).
