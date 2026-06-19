# Deployment Readiness

## Purpose

Validate that a feature is actually ready for deployment, not only passing locally.

This skill is especially important when changes involve:

- database migrations
- production services
- Render
- Vercel
- Neon
- environment variables
- API contracts
- calculation behavior

## Core Principle

A feature is not complete until the deployed environment is verified.

Local tests are necessary but not sufficient.

## Required Flow

1. Identify deployment target.
2. Identify changed layers.
3. Verify local state.
4. Verify migrations.
5. Verify environment variables.
6. Verify build.
7. Verify tests.
8. Verify deployed service.
9. Verify production/preview behavior.
10. Report remaining risks.

## Migration Rule

If a feature adds migrations, the deployment is not ready until the target database has received them.

Required checks:

- migrations exist
- schema.sql is synchronized
- sqlc generate was run
- local tests pass
- migration applied to target database
- API verified against target database

## Final Report

Always report:

- branch
- commit
- deployment target
- migrations applied
- env vars checked
- build result
- test result
- health check result
- manual validation result
- remaining risks
