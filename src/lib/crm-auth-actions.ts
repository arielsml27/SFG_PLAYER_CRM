"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { crmUsers } from "@/db/schema";
import { CRM_AUTH_COOKIE, signSessionToken } from "@/lib/crm-auth";
import { verifyPassword } from "@/lib/password";

export async function crmLogin(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/crm");

  const rows = await db.select().from(crmUsers).where(eq(crmUsers.email, email));
  const user = rows[0];

  if (!user || !verifyPassword(password, user.passwordHash, user.passwordSalt)) {
    redirect(`/crm-login?error=1&next=${encodeURIComponent(next)}`);
  }

  const token = await signSessionToken(user.id);
  const cookieStore = await cookies();
  cookieStore.set(CRM_AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  redirect(next.startsWith("/") ? next : "/crm");
}

export async function crmLogout() {
  const cookieStore = await cookies();
  cookieStore.delete(CRM_AUTH_COOKIE);
  redirect("/crm-login");
}
