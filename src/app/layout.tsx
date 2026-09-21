import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Webmail — CC Consulting", template: "%s — CC Consulting" },
  description: "Moja osobista przestrzeń pocztowa — CC Consulting.",
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { themeColor: "#0c0c0c", colorScheme: "dark" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pl"><body>{children}</body></html>;
}
