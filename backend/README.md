# Recur Backend

Java 25 / Spring Boot 4.0.6 backend for Recur.

## Getting started

1. Copy `.env.example` to `.env` and fill in the required values (see below).
2. Start Postgres (from the repo root):
   ```bash
   docker compose up -d db
   ```
3. Run the app:
   ```bash
   ./gradlew bootRun
   # Windows: gradlew.bat bootRun
   ```

Runs on [http://localhost:8080](http://localhost:8080). Postgres is expected
on host port **5436** (not the default 5432) — see `docker-compose.yml` and
`application.properties`.

## Required environment variables (`.env`)

- `JWT_SECRET` — signing secret for stateless JWT auth, no default.
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth2/OIDC login, no
  default.
- `BREVO_API_KEY`, `MAIL_FROM` — credentials for verification/welcome emails,
  sent via Brevo's transactional email HTTP API. Have defaults except the
  API key, so the app starts without them, but sending real emails requires
  the API key to be set.

Optional overrides (sensible defaults exist): `DB_URL`, `DB_USERNAME`,
`DB_PASSWORD`, `CORS_ALLOWED_ORIGIN`, `JWT_EXPIRATION_MS`,
`MAIL_VERIFICATION_EXPIRY_HOURS`, `MAIL_RESEND_COOLDOWN_SECONDS`,
`FRONTEND_URL`.

## API docs

Swagger UI: [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html)

## Structure

Package convention is domain-first:
`ch.noseryoung.domain.recur.<domain>.{controller,service,repository,model,dto,enums,exceptions}`
(`user`, `auth`, `task`, `group`, `notification`), plus a `shared/` package
for cross-cutting code. See [`docs/architecture.md`](../docs/architecture.md)
for the full breakdown and the allowed dependency direction between domains.

Auth is hybrid: stateless JWT (`jjwt`) for normal API calls via
`JwtAuthenticationFilter`, plus Spring Security OAuth2/OIDC login for
Google, sharing one `SecurityFilterChain` in `SecurityConfig`.

Schema is managed by Hibernate (`spring.jpa.hibernate.ddl-auto=update`) —
there is no Flyway/Liquibase migration tooling in this project.

## Scripts

- `./gradlew bootRun` — run (Windows: `gradlew.bat bootRun`)
- `./gradlew build` — build
- `./gradlew test` — currently broken: `RecurApplicationTests` lives in
  package `ch.noseryoung.recur`, but the `@SpringBootApplication` class is
  in `ch.noseryoung.domain` (a sibling, not an ancestor), so Spring's
  context scan can't find it.
