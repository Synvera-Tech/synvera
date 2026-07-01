// Package config loads and validates runtime configuration from environment variables.
package config

import "os"

// ClerkConfig holds Clerk authentication parameters used to verify JWTs.
type ClerkConfig struct {
	// JWKSURL is the full URL to the Clerk JWKS endpoint, e.g.
	// https://<clerk-frontend-api>/.well-known/jwks.json
	// Required in production; omit only for local file-repo dev mode.
	JWKSURL string

	// Issuer is the expected JWT iss claim, e.g. https://<clerk-frontend-api>.
	// When empty, issuer validation is skipped (dev convenience only).
	Issuer string
}

// Config holds all environment-driven configuration for the API server.
type Config struct {
	// AppEnv is the deployment context (local | development | staging |
	// production), derived from APP_ENV. Used for operational visibility and
	// guardrails only; it never affects calculations or the data model.
	AppEnv Environment

	// DatabaseURL is the Neon/PostgreSQL connection string (e.g. postgres://…).
	// When empty, the server falls back to the embedded file-based catalog.
	DatabaseURL string

	// Port is the TCP port the HTTP server listens on.
	Port string

	// Clerk holds JWT verification parameters for the Clerk authentication provider.
	Clerk ClerkConfig
}

// Load reads configuration from environment variables.
// It first loads a .env file from the working directory (if present),
// so that real environment variables always take precedence over file values.
func Load() Config {
	loadDotEnv()
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	return Config{
		AppEnv:      ParseEnvironment(os.Getenv("APP_ENV")),
		DatabaseURL: os.Getenv("DATABASE_URL"),
		Port:        port,
		Clerk: ClerkConfig{
			JWKSURL: os.Getenv("CLERK_JWKS_URL"),
			Issuer:  os.Getenv("CLERK_ISSUER"),
		},
	}
}
