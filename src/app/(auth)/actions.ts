"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { Prisma } from "@/generated/prisma/client";
import { signIn } from "@/auth";
import { getDb } from "@/lib/db";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { fieldErrors, loginSchema, signupSchema } from "@/lib/validation";
import { recordUsage } from "@/server/usage";

export type AuthState = { errors?: Record<string, string>; email?: string };

function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

export async function signupAction(_prev: AuthState, form: FormData): Promise<AuthState> {
  const parsed = signupSchema.safeParse({ email: form.get("email"), password: form.get("password") });
  const email = String(form.get("email") ?? "");
  if (!parsed.success) return { errors: fieldErrors(parsed.error), email };
  if (!rateLimit(`signup:${clientKey(await headers())}`, 5, 60 * 60_000)) {
    return { errors: { form: "Too many sign-ups from this connection. Please try again in an hour." }, email };
  }

  try {
    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    await getDb().user.create({ data: { email: parsed.data.email, passwordHash } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { errors: { email: "This email already has a stall. Sign in instead." }, email };
    }
    throw error;
  }
  await recordUsage(getDb(), "owner_signed_up");
  await signIn("credentials", { email: parsed.data.email, password: parsed.data.password, redirectTo: "/dashboard/setup" });
  return {};
}

export async function loginAction(_prev: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "");
  const parsed = loginSchema.safeParse({ email, password: form.get("password") });
  if (!parsed.success) return { errors: { form: "Enter your email and password." }, email };
  try {
    await signIn("credentials", { ...parsed.data, redirectTo: safeNext(form.get("next")) });
  } catch (error) {
    if (error instanceof AuthError) return { errors: { form: "That email and password don't match. Check for typos and try again." }, email };
    throw error;
  }
  return {};
}
