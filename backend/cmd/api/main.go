package main

import (
	"context"
	"log"
	"net/http"

	"synvera/backend/internal/config"
	"synvera/backend/internal/handlers"
	"synvera/backend/internal/repository"
)

func main() {
	cfg := config.Load()

	// Operational visibility: announce the environment and the database target
	// with credentials masked, so it is always obvious which database the
	// server is talking to. Never logs the username or password.
	log.Printf("Synvera API: APP_ENV=%s | %s", cfg.AppEnv, config.MaskDatabaseTarget(cfg.DatabaseURL))

	var repo repository.Repository

	if cfg.DatabaseURL != "" {
		pgRepo, err := repository.NewPostgresRepository(context.Background(), cfg.DatabaseURL)
		if err != nil {
			log.Printf("postgres: connection failed (%v) — falling back to file catalog", err)
			repo = repository.NewFileRepository()
		} else {
			log.Printf("Synvera API: connected to Neon PostgreSQL")
			repo = pgRepo
		}
	} else {
		log.Printf("Synvera API: DATABASE_URL not set — using embedded file catalog")
		repo = repository.NewFileRepository()
	}

	auth := handlers.MakeClerkAuthMiddleware(handlers.ClerkConfig{
		JWKSURL: cfg.Clerk.JWKSURL,
		Issuer:  cfg.Clerk.Issuer,
	}, repo)

	mux := http.NewServeMux()
	handlers.RegisterRoutes(mux, repo, auth)

	addr := ":" + cfg.Port
	log.Printf("Synvera API is listening on %s", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatal(err)
	}
}
