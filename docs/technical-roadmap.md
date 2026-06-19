# Technical Roadmap

## Completed

### Auditability Foundation

- Inputs persisted
- Outputs persisted
- Composition modifiers persisted
- Round-trip integration tests
- Schema synchronization

---

## Planned

### Calculation Replay Validation

Status: Open
GitHub Issue: #8

Goal:
Reconstruct a historical calculation and compare replayed results.

---

### CBHPM Versioning

Status: Open
GitHub Issue: #10

Goal:
Store porte table version used at calculation time.

Reason:
Prevent historical calculations from changing after annual CBHPM updates.

---

### Engine Versioning

Status: Open
GitHub Issue: #10

Goal:
Store calculation engine version (git SHA).

Reason:
Different engine versions may produce different results.

---

### Multi-Procedure Share URLs

Status: Open
GitHub Issue: #7

Goal:
Support future multi-procedure compositions.

Reason:
Current share schema assumes one SBN procedure.
