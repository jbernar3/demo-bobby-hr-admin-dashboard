import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { AppShell } from "@/components/shell/AppShell";
import "./globals.css";
import { platform } from "@/data/company";

export const metadata: Metadata = {
  title: {
    default: `${platform.name} · Parallax Labs`,
    template: `%s · ${platform.name}`,
  },
  description: `${platform.name}, the AI-native benefits companion. Demo environment with fictitious data.`,
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
