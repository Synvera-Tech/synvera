"""
merge_spine_into_catalog.py — Merge parsed spine fiches into the canonical catalog.

Reads data/spine_procedures.json (produced by parse_spine_manual.py) and appends
its fiches to backend/internal/repository/procedures.json in the same flat shape
used by the SBN catalog (one row per CBHPM code, grouped by procedure_name).

Design constraints:
  * Append-only — existing SBN rows keep their order, so existing procedure IDs
    (FileRepository idFromIndex / seed sequential code) are NOT disturbed.
  * Idempotent — every previously merged spine row (specialty == "SPINE") is
    removed before re-appending, so re-running never duplicates.
  * No SBN regression — both FileRepository.buildIndex and generate_seed.py group
    by procedure_name. A spine fiche whose name collides with an existing SBN
    procedure is therefore handled carefully:
        - identical CBHPM code set  → skipped (already represented in the catalog);
        - differing  CBHPM code set → appended with a "(Cirurgia de Coluna)" suffix
          so it becomes a distinct, non-merging procedure.

Usage:
    python3 data/parse_spine_manual.py
    python3 data/merge_spine_into_catalog.py
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "backend" / "internal" / "repository" / "procedures.json"
SPINE = ROOT / "data" / "spine_procedures.json"

SPINE_SPECIALTY = "SPINE"
DISAMBIG_SUFFIX = " (Cirurgia de Coluna)"


def main() -> None:
    catalog: list[dict] = json.loads(CATALOG.read_text(encoding="utf-8"))
    spine: list[dict] = json.loads(SPINE.read_text(encoding="utf-8"))

    # ── Idempotency: drop any previously merged spine rows ────────────────────
    catalog = [row for row in catalog if row.get("specialty") != SPINE_SPECIALTY]

    # Index existing catalog by upper-cased name → ordered list of codes.
    existing_codes: dict[str, list[str]] = {}
    for row in catalog:
        existing_codes.setdefault(row["procedure_name"].strip().upper(), []).append(
            row["cbhpm_code"]
        )

    appended_rows: list[dict] = []
    added = skipped = disambiguated = 0

    for fiche in spine:
        name = fiche["name"].strip()
        key = name.upper()
        codes = [c["code"] for c in fiche["cbhpm_codes"]]

        if key in existing_codes:
            if existing_codes[key] == codes:
                skipped += 1            # identical → already represented
                continue
            name = name + DISAMBIG_SUFFIX  # differing → distinct procedure
            disambiguated += 1

        for c in fiche["cbhpm_codes"]:
            appended_rows.append({
                "procedure_name": name,
                "cbhpm_code": c["code"],
                "description": c["description"],
                "porte": c["porte"],
                "num_auxiliaries": c.get("num_auxiliaries", 0),
                "billing_mode": "PER_PROCEDURE",
                "specialty": SPINE_SPECIALTY,
                "laterality_support": False,
            })
        added += 1

    merged = catalog + appended_rows
    CATALOG.write_text(
        json.dumps(merged, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    print(f"✓ Catalog rows: {len(catalog)} SBN + {len(appended_rows)} spine = {len(merged)}")
    print(f"  spine procedures added      : {added}")
    print(f"    of which disambiguated    : {disambiguated}")
    print(f"  identical collisions skipped: {skipped}")


if __name__ == "__main__":
    main()
