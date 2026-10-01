"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, newSessionValue, passwordMatches } from "@/lib/admin-auth";

export async function login(formData: FormData) {
  const attempt = String(formData.get("password") ?? "");
  if (!passwordMatches(attempt)) {
    // Slow down guessing a little.
    await new Promise((r) => setTimeout(r, 700));
    redirect("/admin?error=1");
  }
  (await cookies()).set(ADMIN_COOKIE, newSessionValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: 60 * 60 * 8,
  });
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete({ name: ADMIN_COOKIE, path: "/admin" });
  redirect("/admin");
}
