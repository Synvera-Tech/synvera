# Safe Refactoring

## Purpose

Perform behavior-preserving refactors in production systems.

This skill exists to prevent cosmetic refactors, architecture churn, and regressions.

Refactors must be justified by measurable improvements in:

- maintainability
- testability
- auditability
- separation of concerns
- reduction of duplication
- reduction of bug surface area

Never refactor simply because code is large.

Large code is not sufficient evidence.

## Core Principle

Before changing code, prove:

1. Why the current structure is problematic.
2. What risk the current structure creates.
3. Why the proposed refactor reduces that risk.
4. How behavior equivalence will be validated.

## Investigation Process

### Step 1 — Inventory

Identify:

- large files
- large components
- large functions
- duplicated logic
- duplicated payload construction
- duplicated validation
- duplicated calculations

### Step 2 — Risk Analysis

Classify findings:

- Low Risk
- Medium Risk
- High Risk
- Clinical Risk
- Financial Risk

Clinical and Financial risks always take precedence.

### Step 3 — Refactor Candidates

For each candidate:

- location
- current responsibility
- proposed responsibility
- expected benefit
- regression risk

### Step 4 — Validation Strategy

Define:

- tests
- build validation
- payload comparison
- API comparison
- UI comparison

before changing code.

## Refactor Rules

Do not:

- redesign UI
- change business rules
- change calculations
- change database contracts
- change API contracts

unless explicitly requested.

## Required Output

Produce:

- findings
- risks
- proposed plan
- implementation stages

before modifying code.