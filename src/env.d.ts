/// <reference types="astro/client" />

import type { Managers } from "./lib/ManagerFactory";

declare global {
  namespace Cloudflare {
    interface Env {
      DB: D1Database;
      SESSION: KVNamespace;
      DISCORD_CLIENT_ID: string;
      DISCORD_CLIENT_SECRET: string;
      SESSION_SECRET: string;
      DEV_AUTH_BYPASS?: string;
      DEMO_MODE?: string;
    }
  }

  namespace App {
    interface Locals {
      cfContext: ExecutionContext;
      managers: Managers;
      user?: {
        id: number;
        username: string;
        avatarUrl: string | null;
        forzaGamertag: string | null;
        bannedAt: string | null;
      };
    }
  }
}

export {};
