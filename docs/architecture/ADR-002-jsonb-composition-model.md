# ADR-002: JSONB Composition Model

Status: Accepted

Date: 2026-06

## Context

Compositions contain selected CBHPM codes together with billing metadata.

The original design introduced dedicated modifier tables intended to store:

* quantity_selected
* laterality

This model was never fully adopted.

Actual application behavior evolved toward storing code-specific metadata inside selected_codes JSONB.

Additionally, composition-wide modifiers were being reconstructed by reading the first selected code entry, creating implicit coupling.

## Decision

Adopt JSONB as the canonical persistence model for composition structure.

Store:

* selected_codes JSONB
* modifiers JSONB

The modifiers field contains composition-wide settings.

Example:

{
"quantity_selected": 3,
"laterality": "bilateral"
}

Legacy fallback support remains available for older records.

## Consequences

Positive:

* simpler persistence model
* fewer joins
* explicit composition-level modifiers
* easier serialization
* improved auditability

Negative:

* some loss of relational normalization
* JSON validation becomes application responsibility

The tradeoff is considered acceptable because compositions are aggregate documents rather than relational entities.

## Future Work

* validate modifiers schema
* version composition structure if required
* support future specialty-specific modifiers
