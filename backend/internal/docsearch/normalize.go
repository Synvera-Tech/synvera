package docsearch

import (
	"regexp"
	"strings"
)

// ptStopwords contains Portuguese functional words that carry no domain meaning
// in medical billing queries. Includes both accented and stripped forms so that
// words are matched regardless of the accent-stripping step.
var ptStopwords = map[string]bool{
	// articles, prepositions, conjunctions
	"a": true, "ao": true, "aos": true, "as": true,
	"com": true, "como": true,
	"da": true, "das": true, "de": true, "do": true, "dos": true,
	"e": true, "em": true, "entre": true,
	"mas": true, "me": true,
	"na": true, "nas": true, "no": true, "nos": true, "num": true, "numa": true,
	"o": true, "os": true, "ou": true,
	"para": true, "pela": true, "pelas": true, "pelo": true, "pelos": true, "por": true,
	"qual": true, "quais": true, "quando": true, "que": true, "quem": true,
	"se": true, "sobre": true, "sua": true, "suas": true, "seu": true, "seus": true,
	"um": true, "uma": true,
	"onde": true, "ser": true,
	// demonstratives / others
	"esse": true, "essa": true, "esses": true, "essas": true,
	"este": true, "esta": true, "estes": true, "estas": true,
	"foi": true,
	// accent-stripped variants (after stripAccents is applied)
	"ha": true, "sao": true,
	// accented forms matched before stripping
	"é": true, "há": true, "são": true, "à": true, "às": true,
}

// synonymExpansions maps a normalized (accent-stripped, lower-cased) term to
// additional search terms added during OR-fallback. Keep the list small and
// domain-specific.
var synonymExpansions = map[string][]string{
	"urgencia":   {"emergencia"},
	"emergencia": {"urgencia"},
	"pediatria":  {"pediatrico"},
	"pediatrico": {"pediatria", "crianca"},
	"acesso":     {"via"},
	"segmento":   {"nivel", "segmentos"},
	"segmentos":  {"segmento", "nivel"},
	"nivel":      {"segmento", "niveis"},
	"niveis":     {"nivel", "segmento"},
}

var nonAlphaRe = regexp.MustCompile(`[^\p{L}\p{N}\s]`)

var accentReplacer = strings.NewReplacer(
	"á", "a", "à", "a", "ã", "a", "â", "a", "ä", "a",
	"é", "e", "ê", "e", "è", "e",
	"í", "i", "î", "i", "ì", "i",
	"ó", "o", "ô", "o", "õ", "o", "ò", "o",
	"ú", "u", "û", "u", "ù", "u",
	"ç", "c",
)

func stripAccents(s string) string {
	return accentReplacer.Replace(s)
}

// NormalizeQuery extracts meaningful terms from a Portuguese natural-language
// query by removing stopwords. Returns:
//
//   - normalized: space-joined meaningful terms for plainto_tsquery AND search.
//   - terms: individual terms with synonym expansion for OR-fallback.
//
// If all words are stopwords, the original lowercased query is returned so the
// caller always has a non-empty string to pass to the database.
func NormalizeQuery(q string) (normalized string, terms []string) {
	lower := strings.ToLower(strings.TrimSpace(q))
	cleaned := nonAlphaRe.ReplaceAllString(lower, " ")
	words := strings.Fields(cleaned)

	meaningful := make([]string, 0, len(words))
	for _, w := range words {
		if len(w) < 2 {
			continue
		}
		// Check accented form first, then stripped form.
		if ptStopwords[w] || ptStopwords[stripAccents(w)] {
			continue
		}
		meaningful = append(meaningful, w)
	}

	if len(meaningful) == 0 {
		return lower, []string{lower}
	}

	// Build synonym-expanded terms for OR fallback.
	seen := make(map[string]bool, len(meaningful)*2)
	expanded := make([]string, 0, len(meaningful)*2)
	for _, term := range meaningful {
		if !seen[term] {
			seen[term] = true
			expanded = append(expanded, term)
		}
		key := stripAccents(term)
		for _, alias := range synonymExpansions[key] {
			if !seen[alias] {
				seen[alias] = true
				expanded = append(expanded, alias)
			}
		}
	}

	return strings.Join(meaningful, " "), expanded
}
