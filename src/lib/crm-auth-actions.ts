"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CRM_AUTH_COOKIE, expectedCrmAuthToken } from "@/lib/crm-auth";

export async function crmLogin(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/crm");
  const configuredPassword = process.env.CRM_PASSWORD ?? "";

  if (!configuredPassword || password !== configuredPassword) {
    redirect(`/crm-login?error=1&next=${encodeURIComponent(next)}`);
  }

  const token = await expectedCrmAuthToken();
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
