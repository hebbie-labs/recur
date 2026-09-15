# Stage 1: Build
FROM node:20-alpine AS build-stage
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
# Same-origin API base - the browser always talks to this container's own
# origin, which next.config.ts's rewrites() then proxies to the backend
# (see BACKEND_URL below, set at container *run* time, not here).
ENV NEXT_PUBLIC_API_URL=/api
RUN yarn build

# Stage 2: Run
FROM node:20-alpine AS run-stage
WORKDIR /app
ENV NODE_ENV=production
# `output: "standalone"` (next.config.ts) already produces a pruned
# node_modules + a server.js entrypoint - no separate `yarn install` needed.
COPY --from=build-stage /app/.next/standalone ./
COPY --from=build-stage /app/.next/static ./.next/static
EXPOSE 3000
ENV PORT=3000
# Which backend to proxy /api, /oauth2, /login/oauth2 to - overridden per
# environment (backend-dev / backend-prod) via the container's BACKEND_URL
# env var, e.g. http://backend-prod:8080. Falls back to localhost:8080 if
# unset (next.config.ts).
CMD ["node", "server.js"]
