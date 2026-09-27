# Architecture

An overview of how Recur is put together, for contributors who don't want to
reverse-engineer it from the code. (Agent-facing conventions — commands,
known issues, style rules — live in `CLAUDE.md`; this doc is about how the
system fits together.)

## Overview

Three pieces, run independently: a Spring Boot API, a Next.js frontend, and
Postgres. The frontend never talks to Postgres directly — everything goes
through the API. See the root [`README.md`](../README.md) for how to run
them locally.

```
frontend (Next.js, :3000)  --/api, /oauth2, /login/oauth2-->  backend (Spring Boot, :8080)  -->  Postgres (:5436)
```

## Backend

Package convention is domain-first, not layer-first:
`ch.noseryoung.domain.recur.<domain>.{controller,service,repository,model,dto,enums,exceptions}`
— one package per business domain (`user`, `auth`, `task`, `group`,
`notification`), each with its own layer subfolders. Layers do what their
names say — controllers accept requests and delegate, services hold
business logic, repositories are Spring Data JPA interfaces. Cross-cutting
code with no single domain owner lives in `shared/` instead. See
[Domains (backend)](#domains-backend) below for what each domain owns and
how they're allowed to depend on each other.

**Auth** is hybrid, both paths sharing one `SecurityFilterChain`
(`SecurityConfig`):

- Stateless JWT (`jjwt`) for normal API calls, checked by
  `JwtAuthenticationFilter` on every request.
- Spring Security OAuth2/OIDC for "Sign in with Google".

Whichever path a request came in on, all `Task`/`Project`/`TaskGroup`
queries are scoped to the owner resolved from `SecurityContextHolder` — there
is no cross-user query path in the service layer.

Schema is managed by Hibernate (`ddl-auto=update`); there is no
Flyway/Liquibase migration tooling.

## Frontend

Routing lives in `src/app/` (Next.js App Router — folder structure is the
URL structure). Those `page.tsx` files are thin wrappers only; the actual
page logic lives in `src/components/pages/`, which follows atomic design:

```
src/components/
├── atoms/       small, single-purpose building blocks
├── molecules/   a few atoms composed together
├── organisms/   larger self-contained sections
├── templates/   page-level layout, no real data
├── pages/       actual page implementations (what page.tsx renders)
├── ui/          shadcn primitives
├── auth/
└── error/
```

State is plain React Context (`AuthContext`, `TasksContext`,
`GroupsContext`, `AddTaskContext`) — no Redux/Zustand. Forms use Formik +
Yup. All API calls go through the shared axios instance in
`src/services/api.ts`; domain types (`Task`, `TaskCategory`, ...) live
colocated in `src/services/taskService.ts`, not under `types/`.

## Where things go

One placement rule per folder, for new code. Known existing deviations are
called out as such rather than silently ignored.

### Frontend (`frontend/src/`)

| Folder | What belongs there |
| --- | --- |
| `types/` | Standalone type declarations with no logic that don't belong to a specific service (`auth.ts`, `notifications.ts`, `privacy.ts`). |
| `services/` | Axios calls against the backend API, plus that area's domain types/DTOs/enums (e.g. `Task`, `TaskCategory` in `taskService.ts`) — **known deviation**: domain types intentionally sit next to their service instead of in `types/`, tracked in #191. |
| `hooks/` | Reusable React hooks with state/effect logic shared by more than one component. |
| `schemas/` | Formik + Yup validation schemas for forms. |
| `constants/` | Static, unchanging values/option lists with no logic (dropdown options, links). |
| `lib/` | Thin wrappers around third-party libraries/UI conventions (shadcn's `cn()`, the toast wrapper, category styling maps). |
| `utils/` | Pure, stateless helper functions with no React or library dependency (date formatting, sorting, parsing). |
| `contexts/` | React Context providers for global client state (auth, tasks, groups, ...) — no Redux/Zustand. |
| `components/atoms/` | Smallest single-purpose UI building blocks with no business logic of their own. |
| `components/molecules/` | A handful of atoms composed into a reusable unit (form fields, dialogs, card building blocks). |
| `components/organisms/` | Larger self-contained sections combining several molecules/atoms, usually the ones that load data. |
| `components/templates/` | Page-level layout/grid only, no real data. |
| `components/pages/` | The actual page implementation rendered by the matching `page.tsx`. |
| `components/ui/` | shadcn/ui primitives — kept as generated, not hand-extended. |

### Backend (`backend/.../domain/recur/`)

Domain-first, not layer-first: each business domain owns a package with its
own layer subfolders, not the other way around.

| Folder | What belongs there |
| --- | --- |
| `<domain>/controller/` | REST endpoints: accept and validate the request, delegate to a service — no business logic. |
| `<domain>/service/` | Business logic and transaction boundaries. |
| `<domain>/repository/` | Spring Data JPA interfaces, no implementation. |
| `<domain>/model/` | JPA entities. |
| `<domain>/enums/` | Domain enums shared across multiple models/DTOs of that domain. |
| `<domain>/dto/` | Request/response objects that cross the API boundary — never used directly as an entity. |
| `<domain>/exceptions/` | Custom exceptions for that domain, all extending `shared/exceptions/ApiException` (status + title), plus their matching error-response types. |
| `<domain>/event/` | `record`s published/consumed via Spring `ApplicationEvent` for the one case a domain needs to react to another domain that isn't allowed to depend on it (see below). |
| `auth/security/` | Auth/OAuth2/JWT infrastructure (filters, `UserDetails` implementations, OAuth2 handlers, `SecurityConfig`) — lives in `auth`, not `shared`, since it only wires `auth`'s own classes. |

### Domains (backend)

- `user` — `User`/`UserPrivacySettings`, `/api/auth/me` CRUD, HIDDEN-profile masking (`UserVisibilityService`). The one domain every other domain may depend on.
- `auth` — login/registration/password-reset/refresh-token flows, OAuth2/JWT.
- `task` — task CRUD, completions, reminders.
- `group` — groups and their projects (`Project` is a group sub-concept,
  not a standalone domain).
- `notification` — email/push notifications, notification settings, the
  reminder scheduler.
- `shared` — code no single domain owns: `GlobalExceptionHandler`/`ApiException`/`ErrorResponse`, the generic `EmailService.send(to, subject, text)` (domain-specific email templates live with their callers, e.g. `AuthService`/`NotificationDispatchService`). Depends on no domain.
- `oauth2` / `jwt` — inside `auth/security/` only, split by auth mechanism.

Domains depend in one direction only: `shared` ← `user` ← `auth`/`group` ←
`task` ← `notification` (each may also depend on everything to its left).
`ArchitectureTest` enforces this by scanning imports — the reverse direction
goes through a domain event instead of a direct call, and a domain never
imports another domain's `repository` package directly (only its `service`;
`UserRepository` is the one accepted exception).
  instead of business domain (OAuth2/OIDC login vs. JWT issuing/refresh).

A class used across domains (`SecurityConfig`, `CustomUserDetails`,
`CustomUserDetailsService`, `EmailService`, `User`, `UserRepository`,
`ErrorResponse`, `GlobalExceptionHandler`) or the only one of its kind in a
package (e.g. `PrivacySettingsResponse`, `UserPrivacySettingsRepository`,
`UserPrivacySettings`, `ProfileVisibility`, `AuthController`,
`PrivacySettingsController`, `TaskController`, `AuthService`,
`PrivacySettingsService`, `TaskService`) stays flat at the package root
instead of getting a single-file subpackage.

### Component subfolders (frontend)

Within `components/atoms/`, `components/molecules/`, and
`components/organisms/`, files are grouped one level deeper by theme,
without changing the atomic-design level itself:

- `form` (molecules only) — Formik-bound form fields.
- `dialog` / `dialogs` — modal dialogs (`molecules/dialog/` holds generic
  dialog primitives; `organisms/dialogs/` holds concrete feature dialogs).
- `sidebar` — sidebar navigation pieces.
- `task` — task-card/task-form building blocks.
- `auth` — login/signup (`organisms/auth/`) or auth-status/verification UI
  (`molecules/auth/`).
- `settings` (organisms only) — account/notification/privacy settings
  forms.
- `calendar` (organisms only) — calendar views.
- `loading` (atoms only) — loading-state indicators.

A component with no natural sibling (e.g. `AppBar`, `Empty`, `Pagination`)
stays flat at the folder root instead of getting a single-file subfolder.

## Auth flow

1. **Password login**: client posts credentials, backend verifies and
   returns a signed JWT. The client sends it as `Authorization: Bearer
   <token>` on subsequent requests; `JwtAuthenticationFilter` validates it.
2. **Google login**: client hits `/oauth2/authorization/google`, Spring
   Security's OAuth2 client handles the redirect dance with Google, and on
   success the backend's success handler issues the same kind of JWT the
   password flow does — from that point on both paths are indistinguishable
   to the rest of the app.

## Further reading

- [`backend/README.md`](../backend/README.md) — backend setup, env vars,
  scripts.
- [`frontend/README.md`](../frontend/README.md) — frontend setup, structure,
  scripts.
- [`docs/data-requests.md`](data-requests.md) — GDPR data access/deletion
  runbook.
- `CLAUDE.md` — agent-facing conventions, commands, and known issues.
