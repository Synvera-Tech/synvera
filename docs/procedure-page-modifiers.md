# Procedure Page Modifiers - Implementation Guide

**Objective:** Enable users to select billing modifiers for spine/neurosurgery procedures so the calculator applies correct multipliers and additive charges.

---

## Data Model

### Modifier Categories (Database Schema)

```sql
-- Procedure modifiers table (to be created in migrations)
CREATE TABLE procedure_modifiers (
    id SERIAL PRIMARY KEY,
    procedure_code VARCHAR(20) NOT NULL REFERENCES procedures(cbhpm_code),
    modifier_type VARCHAR(50) NOT NULL,  -- 'segments', 'laterality', 'approach', 'implant', etc.
    modifier_value VARCHAR(50) NOT NULL, -- 'bilateral', 'anterior', 'bone_graft', etc.
    multiplier DECIMAL(3,2),             -- 1.0 = no change, 2.0 = 2× price, etc.
    additive DECIMAL(10,2),              -- Fixed amount to add to base price
    applies_to_specialty VARCHAR(100)    -- 'Coluna Vertebral', 'Neurocirurgia', or NULL for all
);

-- Selected modifiers for a calculation
CREATE TABLE calculation_modifiers (
    id SERIAL PRIMARY KEY,
    calculation_id INTEGER REFERENCES calculations(id),
    procedure_code VARCHAR(20) NOT NULL,
    modifier_type VARCHAR(50) NOT NULL,
    selected_value VARCHAR(50) NOT NULL,
    calculated_multiplier DECIMAL(3,2),
    created_at TIMESTAMP
);
```

---

## UI Components - Checkbox Groups

### Component Structure (shadcn/ui)

Based on the analysis, organize modifiers into logical groups:

```typescript
// app/components/procedure-modifiers.tsx
type ProcedureModifiers = {
  // Anatomical location
  vertebral_level?: 'cervical' | 'thoracic' | 'lumbar' | 'lumbosacral' | 'sacral';
  
  // Laterality (side)
  laterality?: 'unilateral' | 'bilateral';
  
  // Number of segments (for multiplied procedures)
  num_segments?: 1 | 2 | 3 | 4;
  
  // Surgical approach
  approach?: 'anterior' | 'posterior' | 'posterolateral' | 'lateral' | 'minimally_invasive';
  access_type?: 'standard' | 'thoracotomy' | 'costotransversectomy';
  
  // Fusion status
  fusion_type?: 'decompression_only' | 'fusion_required' | 'combined';
  
  // Implant/materials
  implant_type?: 'bone_graft' | 'hardware' | 'disc_replacement' | 'neural_device' | 'none';
  osteoporosis?: boolean;
  cement_augmentation?: boolean;
  
  // Additional procedures
  has_supplementation?: boolean;
  is_revision?: boolean;
  multiple_levels?: boolean;
  
  // Clinical context
  clinical_context?: 'traumatic' | 'degenerative' | 'neoplastic' | 'infectious' | 'deformity' | 'post_operative';
};
```

---

## UI Layout - Procedure Page

### Recommended Component Hierarchy

```
┌─ Procedure Selection ──────────────────────────┐
│  [Dropdown: Select procedure or CBHPM code]   │
│  Description: [Procedure name & description]  │
│  Base Value: R$ 1.234,56                      │
└──────────────────────────────────────────────┘

┌─ Modifiers Section ────────────────────────────┐
│                                                │
│ ▼ ANATOMICAL LOCATION (Optional)             │
│  ☐ Cervical (C1-C7)                          │
│  ☐ Thoracic (T1-T12)                         │
│  ☐ Lumbar (L1-L5)                            │
│  ☐ Lumbosacral (L5-S1)                       │
│  ☐ Sacral/Coccygeal                          │
│                                                │
│ ▼ LATERALITY (For bilateral-eligible procs) │
│  ○ Unilateral (one side)                     │
│  ○ Bilateral (both sides)                    │
│                                                │
│ ▼ NUMBER OF SEGMENTS (If multiplied) *      │
│  ○ 1 segment                                 │
│  ○ 2 segments                                │
│  ○ 3 segments                                │
│  ○ 4+ segments                               │
│  * Multiplier: 1× / 2× / 3× / 4×             │
│                                                │
│ ▼ SURGICAL APPROACH (Optional)               │
│  ☐ Anterior approach                         │
│  ☐ Posterior approach                        │
│  ☐ Posterolateral approach                   │
│  ☐ Lateral/XLIF                              │
│  ☐ Minimally invasive                        │
│                                                │
│ ▼ SPECIAL ACCESS (If applicable)             │
│  ☐ Thoracotomy access                        │
│  ☐ Costotransversectomy access               │
│                                                │
│ ▼ FUSION STATUS (Optional)                   │
│  ○ Decompression only                        │
│  ○ Fusion/arthrodesis required               │
│  ○ Combined approach                         │
│                                                │
│ ▼ IMPLANTS & MATERIALS (Optional)            │
│  ☐ Bone graft                                │
│    ├ Autograft                               │
│    ├ Allograft                               │
│    └ Synthetic                               │
│  ☐ Fixation hardware (plates/screws)         │
│  ☐ Disc replacement/arthroplasty             │
│  ☐ Neural stimulation device                 │
│  ☐ Osteoporosis present (cement needed)      │
│  ☐ Cement augmentation                       │
│                                                │
│ ▼ ADDITIONAL PROCEDURES (Optional)           │
│  ☐ Posterior supplementation (with anterior) │
│  ☐ Multiple levels treated                   │
│  ☐ Revision/repeat procedure                 │
│                                                │
│ ▼ CLINICAL CONTEXT (Optional)                │
│  ○ Traumatic injury                          │
│  ○ Degenerative disease                      │
│  ○ Neoplastic (tumor)                        │
│  ○ Infectious (infection)                    │
│  ○ Deformity                                 │
│  ○ Post-operative complication               │
│                                                │
└──────────────────────────────────────────────┘

┌─ Calculation Result ────────────────────────────┐
│  Base Value:           R$ 1.234,56              │
│  Multipliers:                                   │
│    × 2 (bilateral)     R$ 2.469,12              │
│    × 1 (single segment)                         │
│  Additional charges:                            │
│    + Bone graft        R$   500,00              │
│    + Cement augment    R$   200,00              │
│                                                  │
│  TOTAL VALUE:          R$ 3.169,12              │
│  ├─ Original CBHPM:    R$ 1.234,56              │
│  └─ Adjusted:          R$ 3.169,12              │
│  Faixa:                [Calculated faixa]       │
│                                                  │
│  [Copy] [Save] [Clear Modifiers]               │
│                                                  │
└──────────────────────────────────────────────┘
```

---

## Conditional Display Logic

### Show/Hide Modifiers Based on Procedure

```typescript
// Procedures that support segment multipliers
const SEGMENT_MULTIPLIED = [
  '4.08.13.36-3', // Infiltração foraminal/facetária
  '3.14.03.33-6', // Denervação
  '3.07.15.59-8', // Artroplastia discal
  '2.01.03.14-0', // Bloqueio de nervo periférico
];

// Procedures that can be bilateral
const BILATERAL_ELIGIBLE = [
  '4.08.13.36-3', // Infiltração
  '3.14.03.33-6', // Denervação
  '3.07.15.xx-x', // Most surgical procedures
];

// Procedures that require fusion specification
const FUSION_APPLICABLE = [
  '3.07.15.xx-x', // All arthrodesis codes
  '3.07.15.28-8', // Corpectomia
];

// Show modifiers only if they apply
if (SEGMENT_MULTIPLIED.includes(procedureCode)) {
  showModifier('num_segments');
}
if (BILATERAL_ELIGIBLE.includes(procedureCode)) {
  showModifier('laterality');
}
if (FUSION_APPLICABLE.includes(procedureCode)) {
  showModifier('fusion_type');
}
```

---

## Calculation Logic

### Multiplier Application Order

```typescript
function calculateProcedureValue(
  basePrice: number,
  modifiers: ProcedureModifiers
): { total: number; breakdown: object } {
  
  let multiplier = 1.0;
  let additionalCharges = 0;
  let breakdown = { base: basePrice };
  
  // 1. Apply segment multiplier
  if (modifiers.num_segments) {
    multiplier *= modifiers.num_segments;
    breakdown.segments = `${modifiers.num_segments}×`;
  }
  
  // 2. Apply bilateral multiplier (if applicable)
  if (modifiers.laterality === 'bilateral') {
    multiplier *= 2;
    breakdown.bilateral = '2×';
  }
  
  // 3. Apply implant-specific multipliers
  if (modifiers.implant_type === 'bone_graft') {
    additionalCharges += 500; // Example: R$ 500 for bone graft
  }
  if (modifiers.cement_augmentation) {
    additionalCharges += 200; // Example: R$ 200 for cement
  }
  
  // 4. Apply revision multiplier (if applicable)
  if (modifiers.is_revision) {
    multiplier *= 1.5; // 50% surcharge for revision
  }
  
  const subtotal = basePrice * multiplier;
  const total = subtotal + additionalCharges;
  
  breakdown.subtotal = subtotal;
  breakdown.additionalCharges = additionalCharges;
  breakdown.total = total;
  
  return { total, breakdown };
}
```

---

## Implementation Priority

### Phase 1 (MVP) - Core Modifiers
```
✓ Required: Laterality (unilateral/bilateral)
✓ Required: Vertebral level (cervical/thoracic/lumbar)
✓ Required: Number of segments (1/2/3/4+)
✓ Required: Fusion status (decompression/fusion)
✓ Required: Implant type (yes/no)
```

### Phase 2 - Approach & Context
```
○ Optional: Surgical approach (anterior/posterior/etc.)
○ Optional: Clinical context (traumatic/degenerative/etc.)
○ Optional: Special access (thoracotomy/costotransversectomy)
```

### Phase 3 - Advanced Options
```
○ Optional: Cement augmentation details
○ Optional: Revision procedure tracking
○ Optional: Multiple procedure combinations
```

---

## Database Seeding Example

```sql
-- Example: Infiltração foraminal/facetária (4.08.13.36-3)
INSERT INTO procedure_modifiers VALUES
  (null, '4.08.13.36-3', 'laterality', 'bilateral', 2.0, null, 'Coluna Vertebral'),
  (null, '4.08.13.36-3', 'num_segments', '2', 2.0, null, 'Coluna Vertebral'),
  (null, '4.08.13.36-3', 'num_segments', '3', 3.0, null, 'Coluna Vertebral'),
  (null, '4.08.13.36-3', 'num_segments', '4', 4.0, null, 'Coluna Vertebral');

-- Example: Denervação (3.14.03.33-6)
INSERT INTO procedure_modifiers VALUES
  (null, '3.14.03.33-6', 'num_segments', '2', 2.0, null, 'Coluna Vertebral'),
  (null, '3.14.03.33-6', 'num_segments', '3', 3.0, null, 'Coluna Vertebral'),
  (null, '3.14.03.33-6', 'laterality', 'bilateral', 2.0, null, 'Coluna Vertebral');

-- Example: Bone graft material (additive, not multiplier)
INSERT INTO procedure_modifiers VALUES
  (null, '3.07.15.28-8', 'implant_type', 'bone_graft', null, 500.00, 'Coluna Vertebral'),
  (null, '3.07.15.28-8', 'cement_augmentation', true, null, 200.00, 'Coluna Vertebral');
```

---

## Backend API Changes

### POST /api/calculate

```json
// Request
{
  "procedure_code": "4.08.13.36-3",
  "procedure_name": "Coluna vertebral: infiltração foraminal ou facetária ou articular",
  "base_price": 1234.56,
  "modifiers": {
    "laterality": "bilateral",
    "num_segments": 2,
    "vertebral_level": "lumbar"
  }
}

// Response
{
  "procedure_code": "4.08.13.36-3",
  "base_price": 1234.56,
  "modifiers_applied": {
    "bilateral": { "multiplier": 2.0 },
    "num_segments": { "multiplier": 2.0 }
  },
  "subtotal": 4938.24,
  "additional_charges": 0,
  "total_value": 4938.24,
  "faixa": "2A",
  "calculation_id": "calc_xyz123"
}
```

---

## Frontend Component Structure

```typescript
// app/components/modifiers/ModifierSection.tsx
export function ModifierSection({
  procedure,
  onModifiersChange,
}: {
  procedure: Procedure;
  onModifiersChange: (modifiers: ProcedureModifiers) => void;
}) {
  const applicableModifiers = getApplicableModifiers(procedure.cbhpm_code);
  
  return (
    <div className="space-y-6">
      {applicableModifiers.includes('vertebral_level') && (
        <ModifierGroup
          title="Localização Anatômica"
          type="vertebral_level"
          options={VERTEBRAL_LEVELS}
          onChange={(val) => handleModifierChange('vertebral_level', val)}
        />
      )}
      
      {applicableModifiers.includes('laterality') && (
        <ModifierGroup
          title="Lateralidade"
          type="laterality"
          options={LATERALITY_OPTIONS}
          onChange={(val) => handleModifierChange('laterality', val)}
        />
      )}
      
      {/* ... more modifier groups ... */}
    </div>
  );
}
```

---

## Notes for Frontend Developer

1. **Conditional rendering:** Only show modifiers that apply to the selected procedure
2. **Real-time calculation:** Update total value as user selects modifiers
3. **Clear labeling:** Use Portuguese medical terminology (PT-BR) for field labels
4. **Accessibility:** Use proper `<label>` tags and semantic HTML for checkboxes
5. **Validation:** Warn user if required modifiers are missing
6. **Mobile responsiveness:** Ensure modifier groups stack properly on small screens
7. **State management:** Store selected modifiers in React state or form context

---

## Notes for Backend Developer

1. **Migration:** Create `procedure_modifiers` and `calculation_modifiers` tables
2. **Seeding:** Populate `procedure_modifiers` based on `spine-billing-variables.md`
3. **Validation:** Ensure selected modifiers are valid for the procedure code
4. **Calculation:** Implement multiplier and additive logic in calculator service
5. **Audit:** Store all modifier selections in `calculation_modifiers` for transparency
6. **Documentation:** Link to CBHPM codes and manual sections in code comments
