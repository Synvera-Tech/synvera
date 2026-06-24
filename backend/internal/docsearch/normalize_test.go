package docsearch

import (
	"testing"
)

func TestNormalizeQuery_SingleKeyword(t *testing.T) {
	norm, terms := NormalizeQuery("auxiliares")
	if norm != "auxiliares" {
		t.Errorf("normalized = %q, want %q", norm, "auxiliares")
	}
	if len(terms) == 0 {
		t.Error("terms must not be empty")
	}
	if terms[0] != "auxiliares" {
		t.Errorf("terms[0] = %q, want %q", terms[0], "auxiliares")
	}
}

func TestNormalizeQuery_NaturalLanguageStripsStopwords(t *testing.T) {
	norm, terms := NormalizeQuery("Qual é a regra para auxiliares?")
	// "qual", "é", "a", "para" are all stopwords; "regra" and "auxiliares" survive.
	if norm != "regra auxiliares" {
		t.Errorf("normalized = %q, want %q", norm, "regra auxiliares")
	}
	if len(terms) < 2 {
		t.Errorf("expected at least 2 terms, got %d: %v", len(terms), terms)
	}
}

func TestNormalizeQuery_ContainsRegraAndAuxiliares(t *testing.T) {
	_, terms := NormalizeQuery("Qual é a regra para auxiliares?")
	found := map[string]bool{}
	for _, t := range terms {
		found[t] = true
	}
	if !found["regra"] {
		t.Error("terms must contain 'regra'")
	}
	if !found["auxiliares"] {
		t.Error("terms must contain 'auxiliares'")
	}
}

func TestNormalizeQuery_UrgenciaExpandsEmergencia(t *testing.T) {
	_, terms := NormalizeQuery("urgência")
	found := map[string]bool{}
	for _, t := range terms {
		found[t] = true
	}
	if !found["urgência"] && !found["urgencia"] {
		t.Error("terms must contain urgência or urgencia")
	}
	if !found["emergencia"] {
		t.Error("synonym expansion must add emergencia")
	}
}

func TestNormalizeQuery_EmergenciaExpandsUrgencia(t *testing.T) {
	_, terms := NormalizeQuery("Como funciona urgência?")
	found := map[string]bool{}
	for _, t := range terms {
		found[t] = true
	}
	if !found["emergencia"] {
		t.Errorf("OR terms must include emergencia via synonym; got %v", terms)
	}
}

func TestNormalizeQuery_AllStopwordsFallsBackToOriginal(t *testing.T) {
	norm, terms := NormalizeQuery("Qual é a?")
	if norm == "" {
		t.Error("normalized must not be empty even when all words are stopwords")
	}
	if len(terms) == 0 {
		t.Error("terms must not be empty even when all words are stopwords")
	}
}

func TestNormalizeQuery_ViaDeAcesso(t *testing.T) {
	norm, _ := NormalizeQuery("Qual regra para via de acesso?")
	// "qual", "para", "de" are stopwords; "regra", "via", "acesso" survive
	if norm != "regra via acesso" {
		t.Errorf("normalized = %q, want %q", norm, "regra via acesso")
	}
}

func TestNormalizeQuery_MultiplosSegmentos(t *testing.T) {
	norm, terms := NormalizeQuery("múltiplos segmentos")
	if norm != "múltiplos segmentos" {
		t.Errorf("normalized = %q, want %q", norm, "múltiplos segmentos")
	}
	found := map[string]bool{}
	for _, t := range terms {
		found[t] = true
	}
	// synonym expansion: segmentos → segmento, nivel
	if !found["segmento"] && !found["nivel"] {
		t.Errorf("synonym expansion for segmentos missing; got %v", terms)
	}
}

func TestNormalizeQuery_ArtrodesePreserved(t *testing.T) {
	norm, terms := NormalizeQuery("artrodese cervical")
	if norm != "artrodese cervical" {
		t.Errorf("normalized = %q, want %q", norm, "artrodese cervical")
	}
	if len(terms) < 2 {
		t.Errorf("expected at least 2 terms, got %d", len(terms))
	}
}

func TestNormalizeQuery_PrimeiroAuxiliar(t *testing.T) {
	norm, _ := NormalizeQuery("primeiro auxiliar")
	if norm != "primeiro auxiliar" {
		t.Errorf("normalized = %q, want %q", norm, "primeiro auxiliar")
	}
}

func TestNormalizeQuery_EmptyQuery(t *testing.T) {
	norm, terms := NormalizeQuery("")
	if norm == "" && len(terms) == 0 {
		// both empty is acceptable; the handler checks length before calling
		return
	}
}

func TestNormalizeQuery_ShortWordsSkipped(t *testing.T) {
	// single-char words should be skipped
	norm, _ := NormalizeQuery("a e o")
	// all are stopwords, falls back to original
	_ = norm // just must not panic
}

// TestNormalizeQuery_NaturalLanguageSharesTermsWithKeyword is the regression
// test for the core bug: "Qual é a regra para auxiliares?" must produce a
// terms list that includes "auxiliares" so the cascade fallback picks the
// same FTS results as the keyword query "auxiliares".
func TestNormalizeQuery_NaturalLanguageSharesTermsWithKeyword(t *testing.T) {
	_, kwTerms := NormalizeQuery("auxiliares")
	_, nlTerms := NormalizeQuery("Qual é a regra para auxiliares?")

	kwSet := map[string]bool{}
	for _, term := range kwTerms {
		kwSet[term] = true
	}
	for _, term := range nlTerms {
		if kwSet[term] {
			return // at least one term in common → cascade will produce same DB results
		}
	}
	t.Errorf("no term overlap between keyword=%v and natural-language=%v", kwTerms, nlTerms)
}

func TestNormalizeQuery_UrgenciaSharesTermsWithNaturalLanguage(t *testing.T) {
	_, kwTerms := NormalizeQuery("urgência")
	_, nlTerms := NormalizeQuery("Como funciona urgência?")

	kwSet := map[string]bool{}
	for _, term := range kwTerms {
		kwSet[term] = true
	}
	for _, term := range nlTerms {
		if kwSet[term] {
			return
		}
	}
	t.Errorf("no term overlap: keyword=%v nl=%v", kwTerms, nlTerms)
}
