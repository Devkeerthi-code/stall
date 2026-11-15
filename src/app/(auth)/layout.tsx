import { Wordmark } from "@/components/Wordmark";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="topbar"><div className="wrap topbar__in"><Wordmark /></div></header>
      <main className="auth" id="main">{children}</main>
    </>
  );
}
