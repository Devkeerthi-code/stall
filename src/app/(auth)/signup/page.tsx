import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthForm } from "../AuthForm";

export const metadata: Metadata = { title: "Open a free stall" };

export default async function SignupPage() {
  if ((await auth())?.user) redirect("/dashboard");
  return (
    <div className="auth__card">
      <span className="label">Free · no commission</span>
      <h1>Open your <b>stall</b></h1>
      <p className="muted small">You&apos;ll name your shop, add your WhatsApp number and first product next. It takes about five minutes. Your customers never need an account.</p>
      <AuthForm mode="signup" />
    </div>
  );
}
