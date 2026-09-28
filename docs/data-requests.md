# Handling data access / deletion requests

Internal runbook backing the promises made in [`/datenschutz`](../frontend/src/components/pages/DatenschutzPage.tsx):
personal data is deleted within 30 days of a request, and users can request access to
or portability of their data "by contacting us". There is no self-service delete/export
button in the app (acceptable for manual fulfillment per issue #61) — this doc is the
actual process behind that promise.

Requests come in by email to the contact address listed in the Datenschutzerklärung/Impressum
(`leonhebeisen@proton.me`).

## 1. Verify the request

- Confirm the request comes from the email address associated with the account
  (`User.email`), or ask the requester to confirm it if they wrote from a different address.
- Note the request date — the 30-day deletion SLA counts from here.

## 2. Deletion requests

A user's data lives across these tables (see the `model/` folder of each domain under `backend/src/main/java/ch/noseryoung/domain/recur/`):

- `User` — the account itself (email, name, password hash, OAuth provider info).
- `Task` — owned by the user; also referenced by `TaskGroup`/`Project` if shared.
- `TaskGroup`, `Project` — groups/projects the user owns or is a member of.

Steps:

1. Identify the user's `User.id` (by email) via the database or an authenticated admin query.
2. Delete or anonymize the user's owned `Task`, `Project`, and `TaskGroup` rows. For
   groups/projects shared with other users, prefer removing the requester's membership/
   ownership rather than deleting data other members still rely on — check group
   membership before a hard delete.
3. Delete the `User` row itself.
4. Reply to the requester confirming deletion is complete.
5. Do this within 30 days of the request (step 1) to keep the Datenschutz promise accurate.

There is currently no admin UI or script for this — it's a manual SQL operation against
the Postgres database (see `database/` / `docker-compose.yml` for connection details).
If this becomes a recurring request, consider building an admin endpoint or script instead
of repeating manual SQL.

## 3. Access / portability requests

1. Query the tables above for all rows owned by the requester's `User.id`.
2. Export as JSON or CSV and send it to the verified email address from step 1.

## 4. Log the request

Keep a short record (requester email, request date, type, completion date) so there's
evidence the 30-day SLA is actually being met if ever challenged. A simple entry in this
file's history (via git) or a private note is enough at current volume — revisit if
request volume grows.
