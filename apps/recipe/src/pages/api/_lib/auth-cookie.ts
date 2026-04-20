import { parse, serialize } from "cookie";
import type { NextApiRequest } from "next";

export const AUTH_COOKIE_NAME = "recipe_auth";

const ONE_WEEK_SECONDS = 60 * 60 * 24 * 7;

export function serializeAuthCookie(jwt: string): string {
  return serialize(AUTH_COOKIE_NAME, jwt, {
    httpOnly: true,
    maxAge: ONE_WEEK_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export function serializeClearAuthCookie(): string {
  return serialize(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export function getAuthToken(req: NextApiRequest): string | null {
  const fromParsed = req.cookies?.[AUTH_COOKIE_NAME];
  if (typeof fromParsed === "string" && fromParsed.length > 0) {
    return fromParsed;
  }

  const header = req.headers?.cookie;
  if (typeof header !== "string" || header.length === 0) {
    return null;
  }
  const parsed = parse(header);
  const token = parsed[AUTH_COOKIE_NAME];
  return typeof token === "string" && token.length > 0 ? token : null;
}
