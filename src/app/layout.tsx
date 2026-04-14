import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Scheduler",
  description: "A Calendly-style scheduling platform.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="light">
      <body className="bg-surface text-on-surface">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
