package service

// porteRank converts a CBHPM porte string ("1A".."14C") into a comparable integer rank,
// following the CBHPM hierarchy: the numeric tier dominates, the subletter (A<B<C) breaks
// within a tier. So 12C > 12B > 12A > 11C > … > 1A.
//
// Used to select the principal procedure (R14, CBHPM 4.1/4.2: "procedimento de maior porte"),
// NOT the highest adjusted value after quantity/laterality multipliers. An unrecognised porte
// ranks below every valid porte (-1) so it never wins the principal slot by accident.
func porteRank(porte string) int {
	if len(porte) < 2 {
		return -1
	}
	letter := porte[len(porte)-1]
	var sub int
	switch letter {
	case 'A':
		sub = 0
	case 'B':
		sub = 1
	case 'C':
		sub = 2
	default:
		return -1
	}

	tier := 0
	for _, ch := range porte[:len(porte)-1] {
		if ch < '0' || ch > '9' {
			return -1
		}
		tier = tier*10 + int(ch-'0')
	}
	if tier < 1 {
		return -1
	}
	return tier*3 + sub
}
