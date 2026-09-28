# Security Review — `dev` Branch

Scope: full current state of the `dev` branch (backend `ch.noseryoung.domain.recur.*`, frontend `frontend/src`, `database/`), since the branch has diverged far enough from `main` that a diff-only review would be meaningless — this reviews the code as it stands today. Categories checked: injection (SQL/command/XXE), XSS, SSRF, hardcoded secrets, auth/session handling, input validation, dependency vulnerabilities, and CORS/permissions misconfiguration. Only findings with a concrete, verified exploit path are listed; theoretical/best-practice-only issues are omitted per review policy.

Each finding was independently verified by reading the exact lines cited, not just taken from an automated pass.

---

## Critical

### 1. Mass assignment on Task creation lets any authenticated user overwrite and hijack another user's task

* **File:** `backend/src/main/java/ch/noseryoung/domain/recur/services/TaskService.java:138-157` (also `backend/src/main/java/ch/noseryoung/domain/recur/controllers/TaskController.java:37-38`, `backend/src/main/java/ch/noseryoung/domain/recur/models/Task.java:32-35`)
* **CWE:** CWE-639 (Authorization Bypass Through User-Controlled Key), CWE-915 (Improper Control of Dynamically-Managed Attributes / Mass Assignment)
* **Category:** IDOR / Broken Access Control
* **Description:**
  `POST /api/task` deserializes the raw request body straight onto the JPA entity: `createTask(@Validated(Task.OnCreate.class) @RequestBody Task task)`. `Task.id` (`Task.java:32-35`) is a plain `@Id` field with a Lombok `@Setter` and no `@JsonIgnore` / `@JsonProperty(access = READ_ONLY)`, so a client-supplied `"id"` in the JSON body binds directly onto the entity.

  `TaskService.createTask()` (line 138) only ever sets `owner`/`project` before calling `taskRepository.save(task)` (line 154) — it never checks whether the supplied `id` already belongs to an existing row. `Task` has no `@Version` field, so Spring Data JPA's default `isNew()` check is "id is null → persist, id is non-null → merge." Supplying an existing task's UUID makes Hibernate `merge()` the incoming fields onto that row instead of inserting a new one — including reassigning `owner` to the attacker — completely bypassing the ownership checks (`hasAccess()`) that protect every other Task endpoint.

  The frontend is aware `id` must never be client-supplied — `frontend/src/services/taskService.ts:62-63` defines `ServerOwnedFields` including `"id"` and strips it via `NewTask = Omit<Task, ServerOwnedFields>` — but this is a TypeScript-only convention with zero backend enforcement; any direct API call (curl, Postman, a modified frontend build) bypasses it entirely.
* **Exploit Scenario:** An attacker who is an authenticated user and knows or has seen a victim's task UUID (e.g. via a shared group/project where task ids are visible to fellow members) sends:
  ```
  POST /api/task
  { "id": "<victim-task-uuid>", "name": "pwned", "category": "OTHER",
    "frequency": "ONCE", "description": "x", "dateUntil": "2099-01-01T00:00:00Z" }
  ```
  Since no `project` is set, `createTask` sets `owner = <attacker>` and saves. Hibernate merges onto the victim's existing row: the task's owner is reassigned to the attacker and all its fields are overwritten — a full write-primitive against another user's data and an ownership takeover, with no access-control check anywhere in the path.
* **Fix Recommendation:** Never bind the persistence entity directly from client input on a create endpoint.
  1. Immediate fix: `task.setId(null);` as the first line of `TaskService.createTask()`, before any further processing, so a client-supplied id can never reach `save()`.
  2. Structural fix: introduce a `CreateTaskRequest` DTO with no `id` field (mirroring how `ProjectService.createProject` / `GroupService.createGroup` already build a fresh entity from whitelisted fields only) and build a new `Task` via its `@Builder` from that DTO.
  3. Defense in depth: annotate `Task.id` with `@JsonProperty(access = JsonProperty.Access.READ_ONLY)` so Jackson refuses to bind it from request bodies at all.

---

## Low / Informational

### 2. Real user PII committed to the repository

* **File:** `database/app_user.csv`
* **CWE:** CWE-200 (Exposure of Sensitive Information)
* **Category:** Sensitive data exposure (not one of the requested categories, but adjacent enough to flag)
* **Description:** This tracked file contains what appears to be a real seed/export of user data — actual email addresses, names, and Google avatar URLs — committed to git history. Password hash columns are empty, so this is not a credential leak, but it is real PII sitting in a repository, retrievable by anyone with repo access (and, if the repo is or becomes public, permanently in git history).
* **Exploit Scenario:** Not directly "exploitable" in the classic sense, but any party with read access to the repository (including a future public fork, a leaked clone, or a CI log) gets a plaintext list of real users' emails and names — a GDPR-relevant exposure given the app's own Datenschutz page commits to data-protection handling.
* **Fix Recommendation:** Replace with synthetic/anonymized seed data, remove the real file from the current tree, and purge it from git history (`git filter-repo` or BFG) if the repository is or will be shared beyond the core team. Add a `.gitignore`/pre-commit check to prevent real exports from being committed to `database/` again.

---

## Checked, no high-confidence findings

* **SQL/JPQL injection:** all repository queries use parameterized `@Param` binding; no string concatenation into queries found.
* **Command injection / XXE:** no `ProcessBuilder`/`Runtime.exec`/XML parsing of untrusted input found.
* **JWT / session handling:** `JwtService` correctly verifies signature and expiry (jjwt 0.12.6); no algorithm-confusion or missing-verification issues found in `JwtAuthenticationFilter` or the OAuth2/OIDC login handlers.
* **CORS:** `SecurityConfig.corsConfigurationSource()` uses an explicit allow-listed origin from a property, not a wildcard combined with credentials — not the classic misconfiguration.
* **Ownership/authorization on read/patch/delete:** `TaskController`/`GroupController`/`ProjectController` are properly scoped via `hasAccess()`/`requireMembership()` — the one gap is the create-path issue above.
* **XSS:** the only `dangerouslySetInnerHTML` in the frontend (`frontend/src/app/layout.tsx:32`) is a static, hardcoded theme-init script, not user-controlled data — not exploitable.
* **Hardcoded secrets:** `backend/.env.example` / `frontend/.env.example` contain only empty placeholders; no real secret values are committed.
* **Dependency versions:** `jjwt 0.12.6`, `Spring Boot 4.0.6`, `Next 16.3.4`, `React 19.2.7` — no version-specific CVE could be confidently matched to the exact pinned versions in use.
* **`frontend/src/proxy.ts`:** does not proxy arbitrary user-supplied hosts (path-only forwarding to a fixed backend); an `X-Forwarded-Host` trust question was investigated but has no concrete end-to-end exploit path (would require an attacker-controlled header on the victim's own top-level OAuth navigation, and Google's registered redirect_uri allowlist independently blocks a spoofed host).

---

## Summary

| # | Finding | Severity |
|---|---|---|
| 1 | Mass assignment / IDOR on `POST /api/task` via client-supplied `id` | **Critical** |
| 2 | Real user PII committed in `database/app_user.csv` | Low |

**Priority action:** fix Finding 1 before the next release — it allows any authenticated user to overwrite and reassign ownership of another user's task data with no rate limiting or special access required.
