# Afere System Audit

## Purpose

Coordinate the correct audit strategy for Afere issues.

Use this skill when the issue is ambiguous, cross-cutting, or may involve multiple layers of the system.

This skill does not replace specialized skills. It selects and sequences them.

## Invocation Examples

/afere-system-audit

Analyze the issue, classify it, select the appropriate specialized skills, and define the investigation order before proposing changes.

## Core Principle

Do not guess which layer is broken.

Classify the issue first.

Then route the investigation.

## Available Specialized Skills

- investigative-debug
- ui-investigation
- calculation-audit
- clinical-rules-audit
- architecture-review
- release-readiness
- data-model-audit

## Classification Rules

### UI / Visual / Interaction issue

Use:

1. ui-investigation
2. investigative-debug

Examples:

- modal animation
- horizontal scroll
- layout shift
- broken radius
- Tailwind class conflict
- Framer Motion issue

### Calculation issue

Use:

1. calculation-audit
2. investigative-debug

Examples:

- urgency fee not applied
- pediatric fee not applied
- wrong total
- assistant fees incorrect
- anesthesia not calculated

### Clinical/domain rule issue

Use:

1. clinical-rules-audit
2. calculation-audit
3. investigative-debug

Examples:

- CBHPM rule
- SBN composition
- spine surgery multiplier
- emergency rule
- pediatric rule
- same access route rule
- different access route rule

### Database/modeling issue

Use:

1. data-model-audit
2. architecture-review
3. investigative-debug

Examples:

- wrong SBN → CBHPM cardinality
- missing relationship table
- SQLC query mismatch
- migration risk
- incorrect constraint

### Architecture issue

Use:

1. architecture-review
2. data-model-audit if database is involved
3. calculation-audit if calculation is involved

Examples:

- new feature design
- refactor
- auth model
- history
- sharing
- RAG/document search

### Release/deployment issue

Use:

1. release-readiness
2. investigative-debug

Examples:

- Vercel production issue
- broken deployment
- environment variable mismatch
- build failure
- production regression

## Mandatory Output

Before modifying code, produce:

1. Issue Classification
2. Primary Skill
3. Secondary Skills
4. Investigation Order
5. Evidence Required
6. Files/Areas to Inspect
7. Stop Conditions

## Stop Conditions

Do not implement if:

- the broken layer is not identified
- the payload is not inspected
- the response is not inspected
- the clinical rule is not verified
- the schema relationship is assumed
- the UI issue is not tied to a real DOM/CSS/component cause

## Final Deliverable

After investigation and fix:

1. Root cause
2. Skills applied
3. Evidence collected
4. Files changed
5. Tests performed
6. Remaining risks