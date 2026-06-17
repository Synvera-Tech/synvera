# Investigative Debug

## Purpose

Prevent premature fixes.

The objective is to identify and prove the root cause before modifying any code.

---

## Core Principle

Never fix before understanding.

Never modify before proving.

Never refactor before diagnosing.

---

## Mandatory Process

### 1. Locate

Identify:

- component
- function
- hook
- state
- service
- endpoint
- database object

involved in the issue.

---

### 2. Map

Document the complete execution path.

Example:

User Action
↓
UI State
↓
Payload
↓
API Request
↓
Backend Logic
↓
Database
↓
Response
↓
UI Rendering

---

### 3. Form Hypotheses

Produce multiple plausible explanations.

Example:

Hypothesis A

Hypothesis B

Hypothesis C

---

### 4. Validate

Gather evidence for each hypothesis.

Use:

- source code
- logs
- console output
- network traces
- database queries

---

### 5. Prove Root Cause

Explicitly state:

Root Cause:

<description>

Evidence:

<proof>

---

### 6. Propose Fix

Only after the root cause has been proven.