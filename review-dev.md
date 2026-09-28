# Review: `dev` Branch

Full-project review covering security, code quality/architecture, and documentation. Findings are ordered Critical → High → Medium → Low within each section. This is a report only — no code was changed.

---

## Security

### High

1. **JWT passed as a URL query parameter on OAuth2 login**
   `backend/src/main/java/ch/noseryoung/domain/recur/security/OAuth2AuthenticationSuccessHandler.java`
   On successful Google login, the handler redirects the browser to `<redirect-path>?token=<jwt>`. Putting a bearer token in a URL means it ends up in browser history, the `Referer` header of any subsequent request, and server/proxy access logs — all locations a normal `Authorization` header would avoid. Recommend switching to a short-lived one-time code exchanged for the JWT via a POST request, or setting the JWT as an `HttpOnly` cookie instead of a query param.

2. **Live-looking secrets sitting in `frontend/.env` on disk**
   `frontend/.env` (working tree, not committed) contains what appear to be real values for `JWT_SECRET`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET`. Confirmed the file is `.gitignore`d and has never been committed (`git log --all -- backend/.env` is empty), so this isn't a leak in history — but any secret that has been sitting in a local file long enough to show up in a review should be rotated as a precaution, and it's worth double-checking no earlier commit (before the ignore rule existed) ever added it.

### Medium

3. **Raw JPA entities bound directly as `@RequestBody`**
   `TaskController.createTask`/`patchTask` (`@RequestBody Task`), `GroupController.createGroup` (`@RequestBody TaskGroup`), `ProjectController.createProject` (`@RequestBody Project`).
   Binding entities directly to controller input is a mass-assignment-style risk: any settable field on the entity is client-controllable, constrained only by whatever validation annotations happen to exist on the entity itself, not by an explicit allow-list. Introducing dedicated request DTOs (as is already done for auth — `RegisterRequest`/`LoginRequest`) would make the accepted-fields surface explicit and independent of entity/schema changes.

4. **Unbounded `@RequestParam`s on `patchTask`**
   `TaskController.patchTask` accepts loose params (`resetProgress`, `favorite`, `archived`, `amountDid`, `unassignProject`) with no range/format constraints — e.g. `amountDid` is an arbitrary `Integer` with no `@Min`/`@Max`. Low severity on its own, but combined with finding 3 it's part of a pattern of validation being pushed entirely into the service layer rather than declared at the API boundary.

5. **CORS default allowed-origin list includes a public ngrok hostname**
   `backend/src/main/resources/application.properties` — `app.cors.allowed-origin` defaults to `http://localhost:3000,https://unmoved-giant-factual.ngrok-free.dev`, and the CORS config also sets `allowedHeaders=List.of("*")` with `allowCredentials(true)`. A wildcard-tunnel origin baked into a default (rather than only being set via an env var for local dev) is easy to accidentally carry into a real deployment. Worth confirming this default is never active outside local dev, and that the ngrok origin gets removed once no longer needed.

### Low

6. **`spring.jpa.show-sql=true` in `application.properties`**
   Logs full SQL (and, depending on logger level, bound parameters) — fine for local dev, but should be confirmed off in any shared/staging/prod profile to avoid leaking data into logs.

7. **Broad trust model for group membership actions** (by design, worth confirming)
   `GroupService.removeMember` / `deleteGroup` only check that the caller is *any* member of the group — there's no owner/admin role, so any member can remove any other member or delete the whole group (cascading task/project deletion). The code has an explicit comment stating this is intentional ("jedes Mitglied darf das — keine Admin-Rolle"). Not a bug, but flagging it here so the team explicitly signs off on "any member can delete the group for everyone" as the intended behavior before it surprises someone in production.

### Checked and looks correct (no action needed)

- Task/Group/Project access is consistently scoped by the authenticated user from `SecurityContextHolder` (`TaskService.hasAccess`, ownership/group-membership checks), not by any client-supplied identity — matches what CLAUDE.md claims.
- Task deletion is correctly gated on `isArchived == true` before allowing `deleteById`.
- `GlobalExceptionHandler` returns generic error bodies for the catch-all/`DataIntegrityViolationException` cases and logs full exception detail server-side only — no stack traces or internal details leak into API responses.
- Passwords are hashed with BCrypt and never appear to be exposed via response DTOs; login doesn't distinguish "no such user" from "wrong password" in its error path.

---

## Code Quality & Architecture

### Medium

1. **Inconsistent optimistic-update safety between `TasksContext` and `GroupsContext`**
   `frontend/src/contexts/TasksContext.tsx` merges the 15s auto-sync poll result against local state by `updatedAt` (`mergeTasks`) specifically to avoid clobbering in-flight optimistic writes. `frontend/src/contexts/GroupsContext.tsx`'s `syncGroups` has no such protection — it fully overwrites `groups`/`projectsByGroupId` on every poll. The code comment justifies this by asserting there are no long-lived optimistic updates for groups/projects today, which is true now but will silently regress the moment such a feature is added (e.g. optimistic project rename).

2. **`patchTask`'s declared `startTime`/`durationMinutes` options are silently dropped**
   `frontend/src/services/taskService.ts` — `PatchTaskOptions` declares top-level `durationMinutes?`/`startTime?` fields, but `patchTask`'s destructuring never reads them, so they're never sent to the backend. Currently harmless because the one real caller nests those fields inside `options.task` instead, but the type signature invites a future caller to pass them top-level and have the call silently no-op. Either wire them through or remove them from the type.

### Low

3. **Narrow lost-update race in `TasksContext` optimistic mutations**
   Overlapping optimistic mutations on the *same* task (e.g. toggle favorite, then toggle archive before the first request resolves) can have a failed first request's rollback (`setTasks(previousTasks)`) stomp a second, still-valid optimistic change, because the rollback snapshot predates it. Narrow in practice (needs two fast successive edits to the same task plus a failure), but worth a guard if this pattern gets reused elsewhere.

4. **`useAutoSync`'s bare `catch {}` swallows real errors**
   `frontend/src/hooks/useAutoSync.ts` — the sync loop's catch block only increments a failure counter; it doesn't log the actual error. A genuine bug in `syncTasks`/`syncGroups` (not just a transient network blip) would be indistinguishable from normal connectivity flakiness in the console/logs.

5. **N+1 request pattern on every group poll**
   `GroupsContext`'s `loadGroupsAndProjects` does `getGroups()` then `Promise.all(groups.map(g => getProjects(g.id)))` — one request per group, re-run on every 15s auto-sync tick. Fine at small scale, but scales linearly with group count per poll interval.

6. **No overlap handling in the week calendar view**
   `frontend/src/components/organisms/CalendarWeekView.tsx` — tasks sharing a timeslot are rendered stacked with identical `zIndex`, so a later task visually covers an earlier one with no lane-splitting. Likely to matter once shared-group tasks make same-slot collisions more common.

7. **Minor inconsistencies**
   - `frontend/src/components/pages/CalendarPage.tsx` exports a function named `CalendarGrid`, unlike sibling page files (e.g. `GroupDetailPage`) whose export matches the filename.
   - `frontend/src/components/organisms/CalendarDayStrip.tsx` hardcodes German weekday letters (`["M","D","M","D","F","S","S"]`) instead of using the `date-fns/locale/de` pattern used elsewhere in the calendar code.
   - `CalendarPage`'s "mark as done" flow fires a success toast unconditionally alongside a fire-and-forget optimistic call that can still fail and roll back afterward, leaving a contradicted success toast on screen.

8. **Backend test suite is broken (pre-existing, already tracked)**
   `./gradlew test` fails because `RecurApplicationTests` sits in `ch.noseryoung.recur` while the `@SpringBootApplication` class is in `ch.noseryoung.domain` (a sibling package, not an ancestor), so Spring's component scan can't find the application context. This is already called out in `CLAUDE.md`, so it's not undocumented — listed here as a standing code-quality gap (no working backend test suite) rather than a new finding.

---

## Documentation

### High

1. **Root `README.md` is stale placeholder content**
   The repo-root `README.md` doesn't mention the actual stack (Spring Boot backend, Next.js frontend), has no real setup instructions (`yarn install`/`yarn dev`, backend `.env` requirements, Docker/Postgres setup), and links to a different GitHub repository (`github.com/lelelon225/recur.git`) than the one this project lives in. This is the first file a new contributor opens — as written it actively misdirects rather than just being incomplete.

### Medium

2. **`frontend/.env` uses the wrong (stale) API URL variable name**
   `frontend/.env` has `VITE_API_URL=/api`, but the actual code (`frontend/src/services/api.ts`) reads `process.env.NEXT_PUBLIC_API_URL`, and `frontend/.env.example` correctly uses `NEXT_PUBLIC_API_URL`. This is a leftover from an earlier Vite-based setup — as it stands, `.env`'s value is never read, so `axios`'s `baseURL` resolves to `undefined` for anyone using this file as-is. This isn't just a documentation gap, it's a live local-dev breakage; worth fixing `frontend/.env` directly, not just flagging.

### Low

3. **No `README.md` in `backend/`** — only build files and source exist; there's no backend-specific setup note (env vars, running migrations if any, Swagger location), which currently all lives only in the root `CLAUDE.md`.

### Positive notes (documentation that is accurate and current)

- `frontend/README.md` correctly describes the Next.js App Router structure, dev/build commands, and the API proxy setup — no changes needed.
- The root `CLAUDE.md` was updated during this review cycle and now accurately reflects the frontend as Next.js (App Router, port 3000, `NEXT_PUBLIC_API_URL`) rather than the previously-documented Vite setup — this is current and correct, and resolves what could otherwise have been flagged as a stale doc.
