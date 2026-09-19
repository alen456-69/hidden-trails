import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hidden Trails · Find your kind of nowhere",
  description: "Discover and share nature’s quieter places. Community-powered spots, thoughtful adventures.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
