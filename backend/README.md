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
- `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM` —
  SMTP credentials for verification/welcome emails (e.g. a Brevo SMTP relay).
  Have defaults except username/password, so the app starts without them,
  but sending real emails requires them to be set.

Optional overrides (sensible defaults exist): `DB_URL`, `DB_USERNAME`,
`DB_PASSWORD`, `CORS_ALLOWED_ORIGIN`, `JWT_EXPIRATION_MS`,
`MAIL_VERIFICATION_EXPIRY_HOURS`, `MAIL_RESEND_COOLDOWN_SECONDS`,
`FRONTEND_URL`.

## API docs

Swagger UI: [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html)

## Structure

Package convention:
`ch.noseryoung.domain.recur.{controllers,services,repositories,models,enums,dto,security,exceptions,utils}`.

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
