import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthForm } from "../AuthForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if ((await auth())?.user) redirect("/dashboard");
  const { next } = await searchParams;
  return (
    <div className="auth__card">
      <span className="label">Shop owners</span>
      <h1>Sign in to your <b>stall</b></h1>
      <AuthForm mode="login" next={next} />
    </div>
  );
}
