import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "oravie_admin";

/** The session value: derived from the password, so it never stores the password itself. */
function sessionToken(password: string) {
  return createHmac("sha256", password).update("oravie-admin-session").digest("hex");
}

const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export const adminConfigured = () => !!process.env.ADMIN_PASSWORD;

export function passwordMatches(attempt: string) {
  const password = process.env.ADMIN_PASSWORD;
  return !!password && safeEqual(sessionToken(attempt), sessionToken(password));
}

export function newSessionValue() {
  return sessionToken(process.env.ADMIN_PASSWORD!);
}

export async function isAdmin() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  const value = (await cookies()).get(ADMIN_COOKIE)?.value;
  return !!value && safeEqual(value, sessionToken(password));
}
