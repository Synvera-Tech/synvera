# Spine Surgery Billing Variables

**Source:** Manual de Diretrizes de Codificação em Cirurgia da Coluna Vertebral (3ª Edição, 2025)

This document identifies variables that affect procedure billing in spine surgery. These should be implemented as checkboxes on the Procedure page to enable accurate value calculation.

---

## 1. **Number of Segments/Levels** 🔢

**Impact:** Price multiplier — procedures cost increases with each additional vertebral segment treated

**Applies to:**
- **4.08.13.36-3** — Coluna vertebral: infiltração foraminal ou facetária ou articular
  - Value is **multiplied by the number of facetary segments and neuroforamina infiltrated** (right and left)
  - Example: bilateral L4-L5 facet injection = 2 segments × base price

- **3.14.03.33-6** — Denervação percutânea ou por radiofrequência
  - **Multiplied by number of segments treated** for billing purposes

- **3.07.15.59-8** — Artroplastia discal (disc replacement)
  - **Multiplied by number of segments operated** for billing purposes

- **2.01.03.14-0** — Bloqueio de nervo periférico
  - Charged **by body segment treated**

**Checkbox Implementation:**
```
☐ Single segment (1 level)
☐ 2 segments
☐ 3 segments
☐ 4+ segments
```

---

## 2. **Bilateral vs. Unilateral** 🔄

**Impact:** Price multiplier or separate charges — bilateral procedures cost more than unilateral

**Applies to:**
- **Infiltrations/Injections:**
  - Facetary infiltrations: can be unilateral OR bilateral (right and left)
  - Example: L4-L5 bilateral foraminal infiltration = 2× multiplier vs. unilateral

- **Denervations:**
  - Radiofrequency ablation of facet nerves: can be unilateral or bilateral

- **Surgical approaches:**
  - Some procedures explicitly code for "bilateral approach" as separate procedure codes

**Checkbox Implementation:**
```
☐ Unilateral (one side)
☐ Bilateral (both sides/levels)
```

**Specific bilaterals noted in manual:**
- "bilateral à direita"
- "bilateral à esquerda"
- "bilateralmente"

---

## 3. **Surgical Approach Method** 🔪

**Impact:** Different approaches may have different procedure codes or modifiers; affects complexity and materials used

**Approaches identified in manual:**

| Approach | Procedures | Code Example |
|----------|-----------|--------------|
| **Anterior** | Discectomy, corpectomy, anterior fusion | 3.07.15.28-8 |
| **Posterior** | Laminectomy, laminoplasty, posterior fusion | 3.07.15.03-8 |
| **Posterolateral** | Foraminal decompression, lateral fusion | 3.07.15.xx-x |
| **Lateral** | Extreme lateral interbody fusion (XLIF) | 3.07.15.xx-x |
| **Minimally Invasive** | Percutaneous procedures, endoscopic | 4.08.13.36-3 |
| **Thoracotomy** | Anterior thoracic spine access | 3.06.01.19-3 |
| **Costotransversectomy** | Posterior thoracic spine access | 3.06.01.02-9 |

**Checkbox Implementation:**
```
☐ Anterior approach
☐ Posterior approach
☐ Posterolateral approach
☐ Lateral/XLIF approach
☐ Minimally invasive/percutaneous
☐ Thoracotomy (thoracic access)
☐ Costotransversectomy (thoracic access)
```

---

## 4. **Osteoporosis** 🦴

**Impact:** Requires different implant materials (cement augmentation) and techniques; affects cost

**Explicit reference in manual:**
> "Se for necessária a infusão de cimento pelo parafuso - paciente com osteoporose"
> (If cement infusion is needed through screw - osteoporosis patient)

**Related conditions that trigger additional procedures:**
- Osteoporosis
- Osteopenia
- Segmental instability (spondylolisthesis)
- Spondylolysis

**Clinical impact:**
- May require bone-anchoring systems with cement augmentation
- Affects choice of fusion materials
- May need supplementary stabilization

**Checkbox Implementation:**
```
☐ Patient has osteoporosis/osteopenia
☐ Requires cement augmentation
☐ Segmental instability present
```

---

## 5. **Implant/Material Type** 💊

**Impact:** Different implants have distinct codes; cost varies by type

**Material categories:**

### Bone Grafts
- **3.07.32.02-6** — Enxerto ósseo (bone graft for fusion)
  - Autograft (patient's own bone)
  - Allograft (donor bone)
  - Synthetic bone substitute
  - Biocompatible materials

### Fixation Hardware
- **Plates for anterior fixation** — PLACA PARA FIXAÇÃO ANTERIOR
- **Transpedicular screws** — Parafusos pediculares
- **Interbody cages** — Gaiolas intersomáticas
- **Lateral plate systems**

### Disc Replacement
- **3.07.15.59-8** — Artroplastia discal (artificial disc prosthesis)
  - Only with documented degenerative disc disease
  - Alternative to fusion

### Neural Stimulation Devices
- **3.14.01.10-4** — Implante de eletrodos para neuroestimulação
- **3.14.01.10-5** — Implante de gerador para neuroestimulação

**Checkbox Implementation:**
```
☐ Bone graft (specify type: autograft / allograft / synthetic)
☐ Fixation hardware (plates/screws/cages)
☐ Disc replacement (arthroplasty)
☐ Stimulation device
☐ Cement augmentation
☐ No implants required
```

---

## 6. **Fusion vs. Non-Fusion** 🔗

**Impact:** Arthrodesis (fusion) codes differ from decompression-only codes; higher cost

**Fusion procedures:**
- **Arthrodesis/fixation codes:** Include "artrodese" or "fixação"
- May be anterior, posterior, or combined (360°)
- Associated with higher costs due to implants and longer operative time

**Non-fusion procedures:**
- **Decompression-only:** Laminectomy, foraminotomy without arthrodesis
- **Motion-preserving:** Disc replacement, ligament reconstruction
- Lower cost

**Manual distinction:**
> "Posterior com laminectomia ou laminoplastia - **sem artrodese**"
> vs.
> "Posterior com artrodese"

**Checkbox Implementation:**
```
☐ Decompression only (no fusion)
☐ Fusion/arthrodesis required
☐ Hybrid approach (decompression + selective fusion)
```

---

## 7. **Additional/Supplementary Procedures** ➕

**Impact:** Combined procedures have additive charges; affects final billing

**Examples from manual:**
- "Anterior fusão **associado ou não** à suplementação posterior"
  (Anterior fusion associated OR NOT with posterior supplementation)

- "Discectomia **e** artrodese em um nível **+** uma fusão em nível adicional"
  (Discectomy AND arthrodesis at one level PLUS fusion at additional level)

- "Concomitante necessidade de discectomia"
  (Concomitant need for discectomy)

**Additional procedures that may combine:**
- Anterior approach + posterior supplementation
- Decompression + fusion at same or adjacent levels
- Tumor/infection resection + reconstruction

**Checkbox Implementation:**
```
☐ Primary procedure only
☐ With posterior supplementation
☐ Combined anterior + posterior approach
☐ Multiple levels treated
☐ Revision/repeat procedure
☐ Concomitant decompression
```

---

## 8. **Clinical Context/Diagnosis** 🏥

**Impact:** Affects code selection and modifier applicability

**Conditions noted in manual:**
- **Tumor** — Vertebral/spinal cord tumors (may require anterior/posterior support, wide resection)
- **Infection** — Osteomyelitis, discitis (may require aggressive debridement, reconstruction)
- **Trauma** — Fractures with neurological deficit (may require immediate stabilization)
- **Degenerative disease** — Stenosis, spondylolisthesis, DISH
- **Deformity** — Scoliosis, kyphosis, lordosis pathology

**Clinical context affects:**
- Approach selection
- Material selection
- Additional procedures required
- Complexity coding

**Checkbox Implementation:**
```
☐ Traumatic injury
☐ Degenerative disease
☐ Neoplastic (tumor)
☐ Infectious (infection/osteomyelitis)
☐ Deformity (scoliosis/kyphosis)
☐ Post-operative complication/revision
```

---

## 9. **Vertebral Levels** 📍

**Impact:** Identifies anatomical location; some codes vary by region

**Spine regions in manual:**
- **Cervical** (C1-C7) — Different approach/implant options
- **Thoracic** (T1-T12) — Requires rib resection or thoracotomy for anterior access
- **Lumbar** (L1-L5) — Most common; standard approaches
- **Sacral** (S1, S2) — Special considerations for lumbosacral fusion
- **Coccygeal** — Limited procedures (e.g., coccydynia infiltration)

**Checkbox Implementation:**
```
☐ Cervical (C1-C7)
☐ Thoracic (T1-T12)
☐ Lumbar (L1-L5)
☐ Lumbosacral (L5-S1)
☐ Sacral/Coccygeal (S1+)
```

---

## Summary: Checkbox Categories for Procedure Page

```
PRIMARY MODIFIERS (Required for most procedures):
  ☐ Vertebral levels: Cervical / Thoracic / Lumbar / Lumbosacral / Sacral
  ☐ Laterality: Unilateral / Bilateral
  ☐ Number of segments: 1 / 2 / 3 / 4+

PROCEDURAL APPROACH:
  ☐ Approach method: Anterior / Posterior / Posterolateral / Lateral / Minimally invasive
  ☐ Access type: Standard / Thoracotomy / Costotransversectomy

FUSION STATUS:
  ☐ Decompression only / Fusion required / Combined approach

IMPLANT/MATERIAL:
  ☐ Implant type: Bone graft / Hardware / Disc replacement / Neural device / None
  ☐ Osteoporosis: Yes / No
  ☐ Cement augmentation needed: Yes / No

ADDITIONAL PROCEDURES:
  ☐ Multiple procedures: Primary only / With supplementation / Multiple levels
  ☐ Revision procedure: Yes / No

CLINICAL CONTEXT:
  ☐ Diagnosis: Traumatic / Degenerative / Neoplastic / Infectious / Deformity / Post-operative
```

---

## References in Manual

**Key pages with billing modifiers:**
- Page 11-50: Procedure definitions with multiplier rules
- Page 103: OPMEs and special considerations
- Throughout: Explicit mention of "multiplicado pelo número de segmentos" and "bilateral"

**Relevant CBHPM codes with modifiers:**
- 4.08.13.36-3 (Infiltração): multiplicado por número de segmentos
- 3.14.03.33-6 (Denervação): multiplicado por número de segmentos
- 3.07.15.59-8 (Artroplastia discal): multiplicado por número de segmentos
- 3.07.15.28-8 (Corpectomia): contexto de necessidade de suporte anterior/posterior
- 3.06.01.02-9 (Ressecção de arcos costais): 30% adicional por arco extra
