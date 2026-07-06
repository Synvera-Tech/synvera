# Synvera — spec-driven build & code-generation entrypoints.
#
# openapi.yaml is the source of truth for the API contract; this Makefile is the
# single, enforced path from spec to generated Go types. Never hand-edit
# backend/internal/generated/openapi.gen.go — change the spec and regenerate.

# Pin the generator so every machine/CI produces identical output.
OAPI_CODEGEN_VERSION := v2.7.0

.PHONY: help generate openapi-generate openapi-verify tools test backend-test

help: ## Show available targets
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

tools: ## Install pinned code-generation tools (oapi-codegen)
	go install github.com/oapi-codegen/oapi-codegen/v2/cmd/oapi-codegen@$(OAPI_CODEGEN_VERSION)

generate: openapi-generate ## Regenerate all spec-driven code

openapi-generate: ## Regenerate Go types from openapi.yaml
	cd backend && go generate ./internal/generated

openapi-verify: openapi-generate ## Fail if generated code drifts from openapi.yaml (CI guard)
	@git diff --exit-code -- backend/internal/generated/openapi.gen.go \
		|| { echo "ERROR: openapi.gen.go is out of sync with openapi.yaml. Run 'make openapi-generate' and commit the result."; exit 1; }

test: backend-test ## Run the full test suite

backend-test: ## Run backend Go tests
	cd backend && go test ./...
