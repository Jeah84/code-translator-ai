import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Code Translator AI",
  description: "Translate code between programming languages using AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
