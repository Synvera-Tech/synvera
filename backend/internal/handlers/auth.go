package handlers

import (
	"context"
	"crypto"
	"crypto/rsa"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"math/big"
	"net/http"
	"strings"
	"sync"
	"time"

	"synvera/backend/internal/models"
	"synvera/backend/internal/repository"
)

// ── Context key ───────────────────────────────────────────────────────────────

type physicianCtxKey struct{}

// physicianIDFromContext retrieves the authenticated physician's internal UUID.
// Returns ("", false) when authentication has not been applied to the context.
func physicianIDFromContext(ctx context.Context) (string, bool) {
	p, ok := ctx.Value(physicianCtxKey{}).(*models.PhysicianAccount)
	if !ok || p == nil {
		return "", false
	}
	return p.ID, p.ID != ""
}

// physicianAccountFromContext retrieves the full PhysicianAccount from context.
// Returns (nil, false) when the auth middleware has not been applied.
func physicianAccountFromContext(ctx context.Context) (*models.PhysicianAccount, bool) {
	p, ok := ctx.Value(physicianCtxKey{}).(*models.PhysicianAccount)
	return p, ok && p != nil
}

func withPhysicianAccount(ctx context.Context, p *models.PhysicianAccount) context.Context {
	return context.WithValue(ctx, physicianCtxKey{}, p)
}

// ── Clerk configuration ───────────────────────────────────────────────────────

// ClerkConfig holds the parameters needed to verify Clerk-issued JWTs.
type ClerkConfig struct {
	// JWKSURL is the full URL to the Clerk JWKS endpoint, e.g.
	// https://<clerk-frontend-api>/.well-known/jwks.json
	JWKSURL string
	// Issuer is the expected JWT iss claim, e.g. https://<clerk-frontend-api>.
	// When empty, issuer validation is skipped (dev convenience only).
	Issuer string
}

// AuthMiddlewareFunc wraps an http.Handler with authentication logic.
type AuthMiddlewareFunc func(http.Handler) http.Handler

// MakeClerkAuthMiddleware returns a middleware that validates Clerk RS256 JWTs,
// resolves the physician account via FindOrCreatePhysician, and injects the
// physician's internal UUID into the request context.
// Requests without a valid Bearer token receive 401.
func MakeClerkAuthMiddleware(cfg ClerkConfig, repo repository.Repository) AuthMiddlewareFunc {
	store := &keyStore{url: cfg.JWKSURL}
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			raw := bearerToken(r)
			if raw == "" {
				http.Error(w, "missing authorization header", http.StatusUnauthorized)
				return
			}
			clerkUserID, err := verifyClerkJWT(raw, cfg.Issuer, store)
			if err != nil {
				log.Printf("auth: token invalid: %v", err)
				http.Error(w, "invalid or expired token", http.StatusUnauthorized)
				return
			}
			physician, err := repo.FindOrCreatePhysician(clerkUserID, "", "")
			if err != nil {
				log.Printf("auth: find or create physician %q: %v", clerkUserID, err)
				http.Error(w, "internal server error", http.StatusInternalServerError)
				return
			}
			next.ServeHTTP(w, r.WithContext(withPhysicianAccount(r.Context(), physician)))
		})
	}
}

// MakeTestAuthMiddleware returns a middleware that injects a fixed physician ID
// by calling FindOrCreatePhysician with testClerkUserID, bypassing JWT validation.
// This must never be used in production — it is exported only for test packages.
func MakeTestAuthMiddleware(repo repository.Repository, testClerkUserID string) AuthMiddlewareFunc {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			physician, err := repo.FindOrCreatePhysician(testClerkUserID, "test@synvera.app", "Test Physician")
			if err != nil {
				http.Error(w, "test auth setup error", http.StatusInternalServerError)
				return
			}
			next.ServeHTTP(w, r.WithContext(withPhysicianAccount(r.Context(), physician)))
		})
	}
}

// bearerToken extracts the raw token from "Authorization: Bearer <token>".
// Returns "" when the header is absent or malformed.
func bearerToken(r *http.Request) string {
	h := r.Header.Get("Authorization")
	token, found := strings.CutPrefix(h, "Bearer ")
	if !found {
		return ""
	}
	return strings.TrimSpace(token)
}

// ── JWKS key store ────────────────────────────────────────────────────────────

type jwksRawKey struct {
	Kid string `json:"kid"`
	Kty string `json:"kty"`
	Use string `json:"use"`
	N   string `json:"n"` // base64url-encoded modulus
	E   string `json:"e"` // base64url-encoded exponent
}

type jwksDoc struct {
	Keys []jwksRawKey `json:"keys"`
}

// keyStore fetches and caches RSA public keys from a JWKS endpoint.
// Keys are refreshed after keyStoreTTL or on a cache miss.
type keyStore struct {
	url string
	mu  sync.RWMutex
	m   map[string]*rsa.PublicKey
	ttl time.Time
}

const keyStoreTTL = 15 * time.Minute

func (s *keyStore) get(kid string) (*rsa.PublicKey, error) {
	s.mu.RLock()
	if time.Now().Before(s.ttl) {
		if k, ok := s.m[kid]; ok {
			s.mu.RUnlock()
			return k, nil
		}
	}
	s.mu.RUnlock()

	if err := s.refresh(); err != nil {
		return nil, err
	}

	s.mu.RLock()
	k, ok := s.m[kid]
	s.mu.RUnlock()
	if !ok {
		return nil, fmt.Errorf("unknown key id %q", kid)
	}
	return k, nil
}

func (s *keyStore) refresh() error {
	if s.url == "" {
		return fmt.Errorf("CLERK_JWKS_URL not configured")
	}
	s.mu.Lock()
	defer s.mu.Unlock()

	resp, err := http.Get(s.url) //nolint:noctx
	if err != nil {
		return fmt.Errorf("fetch JWKS: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("JWKS endpoint returned HTTP %d", resp.StatusCode)
	}

	var doc jwksDoc
	if err := json.NewDecoder(resp.Body).Decode(&doc); err != nil {
		return fmt.Errorf("decode JWKS: %w", err)
	}

	keys := make(map[string]*rsa.PublicKey, len(doc.Keys))
	for _, k := range doc.Keys {
		if k.Kty != "RSA" || k.Use != "sig" {
			continue
		}
		pub, err := parseRSAKey(k.N, k.E)
		if err != nil {
			log.Printf("auth: skip JWKS key %q: %v", k.Kid, err)
			continue
		}
		keys[k.Kid] = pub
	}
	s.m = keys
	s.ttl = time.Now().Add(keyStoreTTL)
	return nil
}

func parseRSAKey(nB64, eB64 string) (*rsa.PublicKey, error) {
	nb, err := base64.RawURLEncoding.DecodeString(nB64)
	if err != nil {
		return nil, fmt.Errorf("decode modulus: %w", err)
	}
	eb, err := base64.RawURLEncoding.DecodeString(eB64)
	if err != nil {
		return nil, fmt.Errorf("decode exponent: %w", err)
	}
	e := 0
	for _, b := range eb {
		e = e<<8 | int(b)
	}
	return &rsa.PublicKey{N: new(big.Int).SetBytes(nb), E: e}, nil
}

// ── JWT verification ──────────────────────────────────────────────────────────

type jwtHeader struct {
	Kid string `json:"kid"`
	Alg string `json:"alg"`
}

type jwtClaims struct {
	Sub string  `json:"sub"`
	Iss string  `json:"iss"`
	Exp float64 `json:"exp"`
}

// verifyClerkJWT validates a Clerk-issued RS256 JWT.
// It verifies the signature via JWKS, checks expiration, and validates the issuer
// when cfg.Issuer is non-empty. Returns the Clerk user ID (sub claim) on success.
func verifyClerkJWT(token, issuer string, store *keyStore) (string, error) {
	parts := strings.SplitN(token, ".", 3)
	if len(parts) != 3 {
		return "", fmt.Errorf("malformed JWT (expected 3 segments)")
	}

	// Parse header to get key ID and algorithm.
	hBytes, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return "", fmt.Errorf("decode header: %w", err)
	}
	var hdr jwtHeader
	if err := json.Unmarshal(hBytes, &hdr); err != nil {
		return "", fmt.Errorf("parse header: %w", err)
	}
	if hdr.Alg != "RS256" {
		return "", fmt.Errorf("unsupported algorithm %q (expected RS256)", hdr.Alg)
	}

	// Resolve the signing key from JWKS.
	key, err := store.get(hdr.Kid)
	if err != nil {
		return "", fmt.Errorf("resolve signing key: %w", err)
	}

	// Verify the RS256 signature over header.payload.
	sig, err := base64.RawURLEncoding.DecodeString(parts[2])
	if err != nil {
		return "", fmt.Errorf("decode signature: %w", err)
	}
	digest := sha256.Sum256([]byte(parts[0] + "." + parts[1]))
	if err := rsa.VerifyPKCS1v15(key, crypto.SHA256, digest[:], sig); err != nil {
		return "", fmt.Errorf("signature verification failed")
	}

	// Parse and validate claims.
	cBytes, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return "", fmt.Errorf("decode claims: %w", err)
	}
	var claims jwtClaims
	if err := json.Unmarshal(cBytes, &claims); err != nil {
		return "", fmt.Errorf("parse claims: %w", err)
	}
	if claims.Exp == 0 || time.Now().Unix() > int64(claims.Exp) {
		return "", fmt.Errorf("token expired")
	}
	if issuer != "" && claims.Iss != issuer {
		return "", fmt.Errorf("invalid issuer")
	}
	if claims.Sub == "" {
		return "", fmt.Errorf("missing sub claim")
	}

	return claims.Sub, nil
}
