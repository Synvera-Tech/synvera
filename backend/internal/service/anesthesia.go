package service

import "synvera/backend/internal/models"

// anestheticPorteEquivalence maps each anesthetic porte (AN0–AN8) to its equivalent surgical
// porte, per CBHPM 2022 p.139 item 2. AN0 ("anestesia local") means NO anesthesiologist
// participation (item 3) → no equivalent porte → no fee.
var anestheticPorteEquivalence = map[int]string{
	0: "",
	1: "3A",
	2: "3C",
	3: "4C",
	4: "6B",
	5: "7C",
	6: "9B",
	7: "10C",
	8: "12A",
}

// anesthesiaFallbackPorte is the porte applied when an act needs an anesthesiologist but has
// no anesthetic porte foreseen in the CBHPM (item 4: equivalent to PORTE 3, code 3.16.02.34-7).
const anesthesiaFallbackPorte = 3

// anesthesiaPrincipalPorte returns the highest anesthetic porte among the selected codes that
// have one (the principal anesthetic act). Returns 0 when no code has an anesthetic porte
// (the PORTE 3 fallback is a value rule, not an AN7/AN8 trigger). Used to gate the anesthesia
// assistant (A9), which is only allowed for AN7/AN8.
func anesthesiaPrincipalPorte(codes []models.SelectedCode, anestheticPortes map[string]int) int {
	best := 0
	found := false
	for _, c := range codes {
		if p, ok := anestheticPortes[c.CBHPMCode]; ok {
			found = true
			if p > best {
				best = p
			}
		}
	}
	if !found {
		return 0
	}
	return best
}

// computeAnesthesia derives the anesthesiologist fee from the selected codes' anesthetic portes
// (CBHPM 2022 p.139–140), using the versioned porte values.
//
//   - Each code's anesthetic porte → equivalent surgical porte → monetary value.
//   - AN0 (local) contributes 0 — the anesthesiologist does not participate.
//   - Multiple anesthetic acts: principal (highest value) at 100% + the others degressed by the
//     access-route rate (CBHPM items 5/6: 50% same via/cavity, 70% different incisions).
//   - When NO selected code has a known anesthetic porte, the whole act falls back to PORTE 3
//     (item 4). Codes without a porte that coexist with a known anesthetic act are not counted
//     (e.g. consultations are not anesthetic acts).
func computeAnesthesia(
	codes []models.SelectedCode,
	anestheticPortes map[string]int,
	porteValues map[string]float64,
	route models.AccessRouteType,
) float64 {
	if len(codes) == 0 {
		return 0
	}

	values := make([]float64, 0, len(codes))
	anyKnown := false
	for _, c := range codes {
		porte, ok := anestheticPortes[c.CBHPMCode]
		if !ok {
			continue
		}
		anyKnown = true
		surgical := anestheticPorteEquivalence[porte]
		if surgical == "" { // AN0 → no anesthesiologist participation
			continue
		}
		values = append(values, porteValues[surgical])
	}

	if !anyKnown {
		// Item 4: act(s) without a foreseen anesthetic porte → PORTE 3 equivalent.
		return porteValues[anestheticPorteEquivalence[anesthesiaFallbackPorte]]
	}
	if len(values) == 0 {
		return 0 // all known acts are AN0
	}

	principalIdx := 0
	for i, v := range values {
		if v > values[principalIdx] {
			principalIdx = i
		}
	}

	rate := 0.50
	if route == models.AccessRouteDifferent {
		rate = 0.70
	}

	total := values[principalIdx]
	for i, v := range values {
		if i != principalIdx {
			total += v * rate
		}
	}
	return total
}
