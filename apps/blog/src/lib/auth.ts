import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

import { env } from "@/config/env.mjs";
import prisma from "@/services/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
    github: {
      clientId: env.GITHUB_ID,
      clientSecret: env.GITHUB_SECRET,
    },
  },
});

/**
 * Server-component guard. Redirects to `/login` (with optional callback URL)
 * when no session is present; returns the session object otherwise.
 */
export async function requireSessionForPage(callbackUrl?: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect(
      callbackUrl
        ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
        : "/login"
    );
  }
  return session;
}

/**
 * Route Handler guard. Returns a tagged-union result so callers can
 * early-return without try/catch:
 *   `{ ok: true, session }` — authenticated
 *   `{ ok: false, response }` — 401 NextResponse, ready to return directly
 */
export async function requireSessionForRoute() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return {
      ok: false as const,
      response: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }
  return { ok: true as const, session };
}
