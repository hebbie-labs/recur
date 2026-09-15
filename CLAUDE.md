# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Recur — a full-stack habit/task tracker. Backend: Java 25 / Spring Boot 4.0.6 (`backend/`). Frontend: React + TypeScript + Next.js (`frontend/`). Postgres via Docker (`database/`).

## Commands

Frontend (`frontend/`, package manager is **yarn**):
- `yarn dev` — start dev server (port 3000)
- `yarn build` — `next build`
- `yarn typecheck` — `tsc --noEmit`
- `yarn lint` — ESLint (flat config, no Prettier configured)
- No test script or test framework exists in the frontend.

Backend (`backend/`, Gradle wrapper):
- `./gradlew bootRun` — run (Windows: `gradlew.bat bootRun`)
- `./gradlew build`
- `./gradlew test` — **currently broken**: `RecurApplicationTests` lives in package `ch.noseryoung.recur`, but the `@SpringBootApplication` class is in `ch.noseryoung.domain` (a sibling, not an ancestor), so Spring's context scan can't find it. If this test fails, it's likely this pre-existing issue, not your change.

Full stack locally: `./start-dev.ps1` (Windows) starts Docker, backend, and frontend together — but it runs `docker start recur`, so a container/stack named `recur` must already exist (`docker compose up -d` once, first time).

## Architecture

**Backend** package convention: `ch.noseryoung.domain.recur.{controllers,services,repositories,models,enums,dto,security,exceptions,utils}`. `Task` uses a `Task.OnCreate` validation group so `@NotBlank`/`@NotNull`/`@Future` only apply on POST, not PATCH (PATCH is a partial update — null means "don't change"). All Task queries are scoped by owner from `SecurityContextHolder`; deletion is only allowed for archived tasks.

Auth is hybrid: stateless JWT (`jjwt`) for normal API calls via `JwtAuthenticationFilter`, plus Spring Security OAuth2/OIDC login for Google, sharing one `SecurityFilterChain` in `SecurityConfig`. Touch `SecurityConfig`/`JwtAuthenticationFilter`/OAuth2 handlers together when changing auth.

**Frontend** routing lives in `src/app/` (Next.js App Router — folder structure is the URL structure, `page.tsx` files mark routable segments), but those `page.tsx` files are thin wrappers: actual page logic lives in `src/components/pages/`, which follows atomic design under `src/components/`: `atoms/ molecules/ organisms/ pages/ templates/`, plus `ui/` (shadcn primitives) and `auth/`, `error/`. Path alias `@/` → `src/`. State is plain React Context (`TasksContext`, `AddTaskContext`, `AuthContext`) — no Redux/Zustand. Forms use **Formik + Yup** (not react-hook-form/zod, despite the `schemas/` folder name). Domain types (`Task`, `TaskCategory`, `TaskFrequency`, etc.) live colocated in `services/taskService.ts`, not in `types/`. All API calls go through the shared axios instance in `services/api.ts`; service functions normalize errors via `extractErrorMessage` and convert dates to ISO instants before sending (backend fields are Java `Instant`).

## Environment

Postgres runs on host port **5436** (not 5432) — see `docker-compose.yml` and `application.properties`. Required env vars: backend `.env` needs `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`; frontend `.env` needs `NEXT_PUBLIC_API_URL`.

## Conventions

- Git: feature branches `feat/<Area>-<thing>` (or `feat/<Area>/<thing>`), merged into `dev`, which merges into `main`. Commits use a loose bracketed tag prefix, e.g. `[Added] ...`, `[Updated] ...`.
- Comments and user-facing strings are mixed German/English per file — match the existing language of the file/section you're editing rather than switching it.
- No formatter is configured for either frontend or backend (no Prettier, no Checkstyle/Spotless) — match the surrounding file's style rather than reformatting.
- Before planning or implementing a new feature, run the `grill-mich` skill to interview the user and settle the design first.
