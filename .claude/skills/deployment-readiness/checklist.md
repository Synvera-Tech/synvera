# Deployment Readiness Checklist

## Git

- [ ] Correct branch confirmed
- [ ] Working tree clean
- [ ] Commit pushed
- [ ] Correct remote verified

## Build and Tests

- [ ] Backend tests pass
- [ ] Frontend build passes
- [ ] Typecheck passes
- [ ] Lint passes if available

## Database

- [ ] Migrations identified
- [ ] schema.sql synchronized
- [ ] sqlc generate run
- [ ] Target database migrated
- [ ] Migration state verified

## Environment

- [ ] Render env vars checked
- [ ] Vercel env vars checked
- [ ] Clerk URLs/domains checked if applicable
- [ ] Neon connection checked

## Runtime

- [ ] Health endpoint works
- [ ] Core API endpoint works
- [ ] Frontend talks to backend
- [ ] No console/runtime errors

## Final

- [ ] Deployment verified
- [ ] Remaining risks documented
