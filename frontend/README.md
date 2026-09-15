# Recur Frontend

React + TypeScript + Next.js (App Router) frontend for Recur.

## Getting started

```bash
yarn install
yarn dev
```

Opens on [http://localhost:3000](http://localhost:3000). The backend (Spring
Boot, port 8080) must be running separately — `next.config.ts` proxies
`/api`, `/oauth2`, and `/login/oauth2` to it.

## Structure

- `src/app/` — routing (Next.js App Router). Folder structure is the URL
  structure; `page.tsx` files mark routable segments. These files are thin
  wrappers only — they import and render the actual page from
  `src/components/pages/`.
- `src/components/` — atomic design: `atoms/`, `molecules/`, `organisms/`,
  `pages/`, `templates/`, plus `ui/` (shadcn primitives), `auth/`, `error/`.
- `src/contexts/` — app state via plain React Context (`AuthContext`,
  `TasksContext`, `GroupsContext`, `AddTaskContext`).
- `src/services/` — API calls through the shared axios instance in
  `services/api.ts`. Domain types (`Task`, `TaskCategory`, etc.) live
  colocated here, not under `types/`.
- `src/schemas/` — Formik + Yup validation schemas.

## Scripts

- `yarn dev` — dev server (port 3000)
- `yarn build` — production build (`next build`)
- `yarn start` — run a production build (`next start`)
- `yarn typecheck` — `tsc --noEmit`
- `yarn lint` — ESLint (flat config, no Prettier configured)

No test script or test framework exists in this project yet.
