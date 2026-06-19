# ADR-003: Remove Dead Modifier Tables

Status: Accepted

Date: 2026-06

## Context

The schema contained:

* composition_modifiers
* calculation_modifiers

These tables were originally intended to support modifier persistence.

A codebase audit confirmed:

* no active write path
* no active read path
* no SQLC usage
* no repository usage
* no handler usage

The application had already migrated to JSONB-based persistence.

The tables remained only as historical artifacts.

## Decision

Remove:

* composition_modifiers
* calculation_modifiers

The canonical modifier model is now:

* compositions.modifiers
* selected_codes metadata
* calculation adjustments JSONB

## Consequences

Positive:

* reduced schema complexity
* reduced maintenance burden
* reduced onboarding confusion
* reduced risk of accidental future usage

Negative:

* historical schema documentation must explain the change

This is addressed through ADR documentation.

## Principle

No database structure should exist without:

* a migration
* a write path
* a read path
* test coverage

Unused schema should be removed rather than preserved indefinitely.

## Future Work

Continue auditing for:

* stale tables
* stale columns
* stale indexes
* stale generated models
