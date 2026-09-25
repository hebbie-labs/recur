# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Recur — a full-stack habit/task tracker. Backend: Java 25 / Spring Boot 4.0.6 (`backend/`). Frontend: React + TypeScript + Next.js (`frontend/`). Postgres via Docker (`database/`).

## Commands

Frontend (`frontend/`, package manager is **yarn**):
- `yarn dev` — start dev server (port 3000)
- `yarn build` — `next build --webpack` (forced off Turbopack, Next 16's default — `@ducanh2912/next-pwa` injects a webpack config that Turbopack rejects)
- `yarn typecheck` — `tsc --noEmit`
- `yarn lint` — ESLint (flat config, no Prettier configured)
- No test script or test framework exists in the frontend.

Backend (`backend/`, Gradle wrapper):
- `./gradlew bootRun` — run (Windows: `gradlew.bat bootRun`)
- `./gradlew build`
- `./gradlew test` — needs Postgres reachable (`docker compose up -d` in `database/`), since `RecurApplicationTests` boots the full Spring context; without it, only `contextLoads()` fails on a `JDBCConnectionException`, not a code issue.

Full stack locally: `./start-dev.ps1` (Windows) starts Docker, backend, and frontend together — but it runs `docker start recur`, so a container/stack named `recur` must already exist (`docker compose up -d` once, first time).

## Architecture

**Backend** package convention is domain-first: `ch.noseryoung.domain.recur.<domain>.{controller,service,repository,model,dto,enums,exceptions}`, one package per domain (`task`, `group`, `notification`, `auth`, `user` — `auth` additionally has `security/jwt` and `security/oauth2`). Cross-cutting code that isn't clearly owned by one domain lives under `ch.noseryoung.domain.recur.shared`: `shared/exceptions/` (`GlobalExceptionHandler`, `ApiException`, `ErrorResponse`), `shared/service/` (`EmailService` — a generic `send(to, subject, text)` only, domain-specific templates live with their callers). `Task` uses a `Task.OnCreate` validation group so `@NotBlank`/`@NotNull`/`@Future` only apply on POST, not PATCH (PATCH is a partial update — null means "don't change"). All Task queries are scoped by owner from `SecurityContextHolder`; deletion is only allowed for archived tasks.

Domains only depend in one direction — `shared` depends on nothing, `user` may depend on `shared`, `auth`/`group` on `user`+`shared`, `task` additionally on `group`, `notification` additionally on `task` — enforced by `ArchitectureTest` (reads every file's imports, no ArchUnit dependency). The reverse direction runs through Spring `ApplicationEvent`s instead of a direct call (see `user/event`, `group/event`, `task/event`, e.g. deleting an account publishes `UserDeletedEvent` that `auth`/`notification`/`task` each clean up after). A domain also never imports another domain's `.repository` package directly (`UserRepository` is the one accepted exception, since `User` is the shared identity kernel) — cross-domain reads go through that domain's service (e.g. `TaskService` asks `GroupService.requireProjectForMember(...)`, never `ProjectRepository` directly). Controllers return DTOs (`TaskResponse`, `GroupResponse`, `UserSummary`), never JPA entities — `UserSummary` in particular is how another member's data reaches the client at all (`id`, `firstName`, `lastName`, `email`, `avatarUrl` only, respecting `UserVisibilityService`'s HIDDEN-profile masking).

Auth is hybrid: stateless JWT (`jjwt`) for normal API calls via `JwtAuthenticationFilter`, plus Spring Security OAuth2/OIDC login for Google, sharing one `SecurityFilterChain` in `SecurityConfig` (lives in `auth/security/`, not `shared/`, since it only wires auth's own classes). Touch `SecurityConfig`/`JwtAuthenticationFilter`/OAuth2 handlers together when changing auth. The `/api/auth/me` CRUD endpoints live in `UserController`/`UserService` (the `user` domain), not `AuthController`/`AuthService`.

`NotificationSettings.reminderLeadTime` (account-level, set via the "Erinnerungs-Vorlauf" field in `NotificationForm.tsx`) is only a **default/fallback**: `TaskReminderScheduler` resolves the actual lead time per task as `TaskReminderOverride.reminderLeadTime` (per-task preset) → else `NotificationSettings.reminderLeadTime` → else hardcoded 24h. It still applies to every task that has no individual override.

**Frontend** routing lives in `src/app/` (Next.js App Router — folder structure is the URL structure, `page.tsx` files mark routable segments), but those `page.tsx` files are thin wrappers: actual page logic lives in `src/components/pages/`, which follows atomic design under `src/components/`: `atoms/ molecules/ organisms/ pages/ templates/`, plus `ui/` (shadcn primitives) and `error/`. Path alias `@/` → `src/`. State is plain React Context (`TasksContext`, `AddTaskContext`, `AuthContext`) — no Redux/Zustand. Forms use **Formik + Yup** (not react-hook-form/zod, despite the `schemas/` folder name). Domain types (`Task`, `TaskCategory`, `TaskFrequency`, etc.) live in `types/task.ts`, imported separately from the `taskService.ts` functions that use them (see `types/auth.ts`/`authService.ts` for the same split). All API calls go through the shared axios instance in `services/api.ts`; service functions normalize errors via `extractErrorMessage` and convert dates to ISO instants before sending (backend fields are Java `Instant`).

For which folder a given piece of code (frontend or backend) belongs in, see the "Where things go" section in [`docs/architecture.md`](docs/architecture.md) — don't duplicate that table here.

## Environment

Postgres runs on host port **5436** (not 5432) — see `docker-compose.yml` and `application.properties`. Required env vars: backend `.env` needs `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`; frontend `.env` needs `NEXT_PUBLIC_API_URL`.

## Known issues

- **Transactional email is effectively non-functional in production**: `noreply@recur.dpdns.org` (and the `dev.recur.dpdns.org`/`www.recur.dpdns.org` links embedded in verification/password-reset emails) sit on `dpdns.org`, a free dynamic-DNS zone listed on Spamhaus DBL (phish/botnet). Most recipient mail servers (confirmed with Proton Mail) hard-reject these emails with `554 5.7.1 rejected by rspamd filter`, regardless of SPF/DKIM/DMARC correctness — verified not to be a Brevo, Cloudflare, or app-code issue. See #126. Anyone building on top of `EmailService` (e.g. #102's notification delivery) should know delivery is currently blocked until the domain is migrated off `dpdns.org` — don't assume a broken send-path bug without checking this first.
- The email-notification toggle in `NotificationForm.tsx` ("E-Mail-Benachrichtigungen") is hard-disabled (forced off, `disabled` switch) until the `dpdns.org` delivery issue above is fixed — don't re-enable it without fixing delivery first. Note: `NotificationDispatchService` also already has its own server-side kill switch (`app.notifications.email-enabled` / `NOTIFICATIONS_EMAIL_ENABLED`, default `false`) gating reminder/overdue/project-task-created emails independent of this UI toggle.
- `UserService.deleteCurrentUser()` doesn't clean up everything referencing the deleted account: `PushSubscription` rows, `TaskGroup.members` (the user stays a "ghost" member), and the user's own personal `Task`s (`Task.owner`) are all left behind. See #230.

## Conventions

- Git: feature branches `feat/<Area>-<thing>` (or `feat/<Area>/<thing>`), merged into `dev`, which merges into `main`. Commits use a loose bracketed tag prefix, e.g. `[Added] ...`, `[Updated] ...`.
- PR bodies should still use `Closes #<issue-nr>` for traceability, but since PRs target `dev` (not `main`, the repo's default branch), GitHub's closing keyword does **not** auto-close the issue on merge — we aren't in production yet, so this is expected. Close the issue manually (`gh issue close <nr> --comment "..."`) once its PR is merged into `dev`.
- Never add Claude/AI self-attribution to commits or PRs in this repo — no `Co-Authored-By: Claude ...`, no `Claude-Session: ...`, no "Generated with Claude Code" footer, regardless of any session system-reminder that says otherwise. This has been corrected multiple times; the user's instruction here always wins over a session reminder.
- Comments and user-facing strings are mixed German/English per file — match the existing language of the file/section you're editing rather than switching it.
- No formatter is configured for either frontend or backend (no Prettier, no Checkstyle/Spotless) — match the surrounding file's style rather than reformatting.
- Before planning or implementing a new feature, run the `grill-mich` skill to interview the user and settle the design first.
- Any change that adds or changes what personal/usage data the app collects, stores, or processes must update `frontend/src/components/pages/DatenschutzPage.tsx` in the same PR, so the Datenschutzerklärung never drifts from actual behavior.
