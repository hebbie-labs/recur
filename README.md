# Recur

**your habits, your way**

Recur is a full-stack habit/task tracker: a Java 25 / Spring Boot 4.0.6
backend and a React + TypeScript + Next.js frontend, backed by Postgres.

- Track personal habits and one-off tasks with categories, frequencies and
  due dates.
- Share projects and tasks with a group via invite links.
- Calendar (month/week) and list views, favorites, archiving.

## Repository

[github.com/lelelon225/recur](https://github.com/lelelon225/recur)

## Stack

- `backend/` — Java 25, Spring Boot 4.0.6, Gradle, Postgres via Spring Data
  JPA, hybrid JWT + Google OAuth2/OIDC auth. See
  [`backend/README.md`](backend/README.md).
- `frontend/` — React + TypeScript, Next.js (App Router), Formik + Yup,
  shadcn UI primitives. See [`frontend/README.md`](frontend/README.md).
- `database/` — Postgres via Docker.

## Getting started

Prerequisites: Java 25, Node.js with `yarn`, Docker.

1. **Database**: from the repo root,
   ```bash
   docker compose up -d db
   ```
   Postgres runs on host port **5436** (not 5432).

2. **Backend**: in `backend/`, copy `.env.example` to `.env` and fill in
   `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (see
   [`backend/README.md`](backend/README.md) for the full list), then
   ```bash
   ./gradlew bootRun
   ```
   Runs on [http://localhost:8080](http://localhost:8080).

3. **Frontend**: in `frontend/`, copy `.env.example` to `.env` and set
   `NEXT_PUBLIC_API_URL`, then
   ```bash
   yarn install
   yarn dev
   ```
   Runs on [http://localhost:3000](http://localhost:3000).

On Windows, `./start-dev.ps1` starts Docker, the backend, and the frontend
together — but it runs `docker start recur`, so the container/stack named
`recur` must already exist (i.e. step 1 above must have been run at least
once before).
