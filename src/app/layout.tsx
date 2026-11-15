import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Manrope } from "next/font/google";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Stall: your shop's counter, online", template: "%s · Stall" },
  description: "A free catalogue for small shops. Customers browse your products and order on WhatsApp. No commission.",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = { themeColor: "#F6F1E7", width: "device-width", initialScale: 1, viewportFit: "cover" };

/** Light is the default. Dark only if the person picked it with the toggle. Runs before paint to avoid a flash. */
const themeScript = `try{if(localStorage.getItem("stall-theme")==="dark")document.documentElement.dataset.theme="dark"}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${plexMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a className="skip" href="#main">Skip to content</a>
        {children}
      </body>
    </html>
  );
}
