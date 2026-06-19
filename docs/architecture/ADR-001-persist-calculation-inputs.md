# ADR-001: Persist Calculation Inputs

Status: Accepted

Date: 2026-06

## Context

Originally, the calculations table stored only calculation outputs.

Examples:

* surgeon_value
* auxiliaries_total_value
* anesthesiologist_value
* team_total_value

Although these values were sufficient for reporting, they were insufficient for auditability.

A historical calculation could not be fully reconstructed because the original inputs were not preserved.

The system could answer:

"What value was produced?"

but could not reliably answer:

"Why was this value produced?"

## Decision

Persist calculation inputs alongside outputs.

The calculations table now stores:

* selected_cbhpm_codes
* adjustments
* access_route
* auxiliaries_count
* requires_anesthesia
* physician_id (when available)

Outputs continue to be stored separately.

## Consequences

Positive:

* historical calculations become reproducible
* auditability improves significantly
* future replay validation becomes possible
* future traceability features become possible

Negative:

* larger calculation records
* increased storage consumption

The storage increase is considered acceptable.

## Future Work

* calculation replay validation
* cbhpm_version persistence
* engine_version persistence
* calculation snapshot architecture
