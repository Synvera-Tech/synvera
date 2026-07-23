package handlers_test

import (
	"encoding/json"
	"net/http"
	"strings"
	"testing"

	"synvera/backend/internal/generated"
	"synvera/backend/internal/handlers"
	"synvera/backend/internal/models"
	"synvera/backend/internal/repository"
)

func intPointer(value int) *int { return &value }

func TestCalculateEndpoint_IgnoresDivergentLegacyAuxiliaryCount(t *testing.T) {
	repo := repository.NewFileRepository()
	mux := testMux(repo, "automatic-auxiliaries")
	req := generated.CalculateRequest{
		SelectedCodes: []generated.SelectedCode{{
			CbhpmCode:   "3.14.01.10-4",
			Description: "Implante de eletrodos",
			Porte:       "10A",
		}},
		AuxiliariesCount:   intPointer(4),
		RequiresAnesthesia: false,
		AccessRouteType:    generated.Same,
	}

	w := postCalculateRequest(t, mux, req)
	if w.Code != http.StatusOK {
		t.Fatalf("status %d: %s", w.Code, w.Body.String())
	}
	var response generated.CalculateResponse
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatal(err)
	}
	if response.PrincipalProcedure.NumAuxiliaries != 2 || len(response.IndividualAuxiliaryFees) != 2 {
		t.Fatalf("legacy count overrode catalog: principal=%+v fees=%d", response.PrincipalProcedure, len(response.IndividualAuxiliaryFees))
	}
}

type missingAuxiliaryRepository struct {
	*repository.FileRepository
}

func (*missingAuxiliaryRepository) GetProcedureDefinitions([]string, []string) (map[string]models.CBHPMCode, error) {
	return map[string]models.CBHPMCode{}, nil
}

func TestCalculateEndpoint_MissingNormativeAuxiliaryCountFailsExplicitly(t *testing.T) {
	repo := &missingAuxiliaryRepository{FileRepository: repository.NewFileRepository()}
	mux := http.NewServeMux()
	handlers.RegisterRoutes(mux, repo, noopAuth)
	req := generated.CalculateRequest{
		SelectedCodes: []generated.SelectedCode{{
			CbhpmCode: "3.14.01.10-4",
			Porte:     "10A",
		}},
		RequiresAnesthesia: false,
		AccessRouteType:    generated.Same,
	}

	w := postCalculateRequest(t, mux, req)
	if w.Code != http.StatusUnprocessableEntity {
		t.Fatalf("status %d, want 422: %s", w.Code, w.Body.String())
	}
	if !strings.Contains(w.Body.String(), "não disponível") {
		t.Fatalf("expected explicit normative error, got %q", w.Body.String())
	}
}
