import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Next 16's dev server auto-generates AGENTS.md/CLAUDE.md in this
  // directory otherwise, which collides with the repo's own hand-maintained
  // root CLAUDE.md and just adds noise on every `yarn dev`.
  agentRules: false,

  // Standalone output for a small production Docker image (server.js +
  // a pruned node_modules) - see frontend/Dockerfile.
  output: "standalone",

  // Equivalent of vite.config.ts server.allowedHosts — lets `yarn dev`
  // be reached through an ngrok tunnel in dev.
  allowedDevOrigins: ["*.ngrok-free.dev", "*.ngrok.app"],

  // The /api, /oauth2, and /login/oauth2 backend proxy used to live here
  // as rewrites() - moved to src/proxy.ts because rewrites() is resolved
  // once at `next build` time (frozen into .next/routes-manifest.json),
  // which can't read a per-container BACKEND_URL supplied at `docker run`
  // time. See src/proxy.ts for the actual proxy logic.
};

export default nextConfig;
