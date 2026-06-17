# Data Model Audit

## Purpose

Audit database structures, schemas, relationships, migrations, and generated access layers.

This skill exists to prevent business logic failures caused by incorrect data modeling.

A calculation engine is only as reliable as the data model behind it.

---

# Core Principle

Never assume the schema matches the business domain.

Always prove it.

---

# Investigation Order

Business Rule
↓
Domain Model
↓
Database Schema
↓
Constraints
↓
Queries
↓
Generated Code
↓
Application Behavior

---

# Mandatory Questions

## Domain

What real-world rule is being represented?

Examples:

* One SBN procedure maps to many CBHPM procedures.
* One CBHPM code belongs to many compositions.
* One calculation contains many adjustments.

Document the rule before analyzing tables.

---

## Relationships

Validate cardinality.

Possible relationships:

* 1:1
* 1:N
* N:1
* N:N

Never assume.

Always prove.

---

## Schema Validation

Inspect:

* tables
* primary keys
* foreign keys
* unique constraints
* indexes
* nullable fields
* default values

---

## Query Validation

Inspect:

* joins
* where clauses
* aggregation logic
* grouping logic

Verify the query actually returns the expected business result.

---

## SQLC Validation

Whenever SQLC is used:

Verify:

* generated structs
* generated queries
* nullability mappings
* relationship representation

Never assume SQLC generation implies correctness.

---

## Migration Validation

Every migration must answer:

What data changes?

What constraints change?

What queries break?

Can production data survive the migration?

Can rollback occur safely?

---

# Anti-Hallucination Rules

Forbidden:

"The schema looks correct."

"The relationship appears valid."

Allowed:

"The foreign key enforces X."

"The table allows Y."

"The query returns Z."

"The cardinality is proven to be N:N."

---

# Final Deliverable

1. Business Rule
2. Current Model
3. Proven Cardinality
4. Risks
5. Proposed Model
6. Migration Strategy
7. Validation Plan
