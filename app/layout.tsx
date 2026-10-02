import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Assistora — AI Customer Support",
  description:
    "Build an AI customer support agent for your business.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}