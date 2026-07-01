package config

import (
	"net/url"
	"strings"
)

// Environment identifies the deployment context the API is running in.
// It is derived from the APP_ENV variable and used for operational visibility
// and guardrails. It never influences calculations or the data model.
type Environment string

const (
	EnvLocal       Environment = "local"
	EnvDevelopment Environment = "development"
	EnvStaging     Environment = "staging"
	EnvProduction  Environment = "production"
)

// ParseEnvironment normalizes a raw APP_ENV value into a known Environment.
// Unknown or empty values default to local — the safest environment — so a
// missing configuration can never be mistaken for production.
func ParseEnvironment(raw string) Environment {
	switch strings.ToLower(strings.TrimSpace(raw)) {
	case "production", "prod":
		return EnvProduction
	case "staging", "stage":
		return EnvStaging
	case "development", "dev":
		return EnvDevelopment
	case "local", "":
		return EnvLocal
	default:
		return EnvLocal
	}
}

// IsProduction reports whether the active environment is production.
func (e Environment) IsProduction() bool { return e == EnvProduction }

// MaskDatabaseTarget returns a credential-free description of a database URL
// that is safe to print in startup logs: "host=… db=…". The username and
// password are never included. An empty URL (file-catalog mode) or an
// unparseable URL yields a neutral placeholder rather than leaking the raw
// string.
func MaskDatabaseTarget(databaseURL string) string {
	if databaseURL == "" {
		return "host=(none) db=(embedded file catalog)"
	}
	u, err := url.Parse(databaseURL)
	if err != nil || u.Host == "" {
		return "host=(unparseable) db=(unknown)"
	}
	db := strings.TrimPrefix(u.Path, "/")
	if db == "" {
		db = "(default)"
	}
	return "host=" + u.Host + " db=" + db
}
