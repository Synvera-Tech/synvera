package repository

import "testing"

// AN-1: the anesthetic-porte read path loads the embedded CBHPM data correctly.
func TestFileRepository_GetAnestheticPortes(t *testing.T) {
	repo := NewFileRepository()
	portes, err := repo.GetAnestheticPortes()
	if err != nil {
		t.Fatalf("GetAnestheticPortes: %v", err)
	}
	if len(portes) != 190 {
		t.Fatalf("expected 190 codes with anesthetic porte, got %d", len(portes))
	}

	// Spot checks verified against CBHPM 2022 (p.138–140). Codes present in the catalog.
	cases := map[string]int{
		"3.07.15.31-8": 8, // lesão traumática raquimedular
		"3.02.15.02-1": 5, // craniotomia descompressiva
		"3.07.15.19-9": 5, // laminectomia ou laminotomia
	}
	for code, want := range cases {
		if got, ok := portes[code]; !ok || got != want {
			t.Errorf("anesthetic porte %s = (%d, %v), want %d", code, got, ok, want)
		}
	}

	// Defensive copy: mutating the result must not corrupt the repo.
	delete(portes, "3.07.15.31-8")
	again, _ := repo.GetAnestheticPortes()
	if _, ok := again["3.07.15.31-8"]; !ok {
		t.Fatal("mutating the returned map corrupted the repository")
	}
}
