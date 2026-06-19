# Examples

## Example 1 — Feature with migrations

A calculation feature adds migrations 019–021.

Deployment is not ready until:

- migrations are applied to Neon
- backend can query the new tables
- /api/calculate works against deployed database
- tests pass
- production or preview endpoint is verified

## Example 2 — Frontend-only UI change

A Home redesign changes no backend.

Deployment readiness requires:

- build
- typecheck
- Vercel preview
- visual validation
- no console errors

## Example 3 — Environment variable change

If API URL, Clerk, Neon, or Render variables change:

- identify required env vars
- verify values exist in deployment platform
- redeploy
- test runtime behavior
