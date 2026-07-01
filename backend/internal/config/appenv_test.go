package config

import (
	"strings"
	"testing"
)

func TestParseEnvironment(t *testing.T) {
	cases := map[string]Environment{
		"":            EnvLocal,
		"local":       EnvLocal,
		"LOCAL":       EnvLocal,
		" dev ":       EnvDevelopment,
		"development": EnvDevelopment,
		"stage":       EnvStaging,
		"staging":     EnvStaging,
		"prod":        EnvProduction,
		"production":  EnvProduction,
		"PRODUCTION":  EnvProduction,
		"nonsense":    EnvLocal, // unknown must never resolve to production
	}
	for in, want := range cases {
		if got := ParseEnvironment(in); got != want {
			t.Errorf("ParseEnvironment(%q) = %q, want %q", in, got, want)
		}
	}
}

func TestEnvironmentIsProduction(t *testing.T) {
	if !EnvProduction.IsProduction() {
		t.Error("EnvProduction.IsProduction() = false, want true")
	}
	for _, e := range []Environment{EnvLocal, EnvDevelopment, EnvStaging} {
		if e.IsProduction() {
			t.Errorf("%q.IsProduction() = true, want false", e)
		}
	}
}

func TestMaskDatabaseTarget(t *testing.T) {
	cases := map[string]string{
		"": "host=(none) db=(embedded file catalog)",
		"postgres://user:secret@ep-cool-name.us-east-2.aws.neon.tech/synvera_prod?sslmode=require": "host=ep-cool-name.us-east-2.aws.neon.tech db=synvera_prod",
		"postgres://user:secret@localhost:5432/synvera_local":                                      "host=localhost:5432 db=synvera_local",
	}
	for in, want := range cases {
		if got := MaskDatabaseTarget(in); got != want {
			t.Errorf("MaskDatabaseTarget(%q) = %q, want %q", in, got, want)
		}
	}
}

// MaskDatabaseTarget must never leak credentials from the connection string.
func TestMaskDatabaseTargetHidesCredentials(t *testing.T) {
	masked := MaskDatabaseTarget("postgres://admin:topsecret@db.example.com/synvera")
	for _, leak := range []string{"admin", "topsecret"} {
		if strings.Contains(masked, leak) {
			t.Errorf("MaskDatabaseTarget leaked %q in %q", leak, masked)
		}
	}
}
