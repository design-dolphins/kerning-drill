import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Kerning Drill", description: "毎日5分のカーニング練習" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Some browser extensions add a class to <html> before React starts. This is
  // outside the app's control, so do not surface it as an application error.
  return <html lang="ja" suppressHydrationWarning><body suppressHydrationWarning>{children}</body></html>;
}
