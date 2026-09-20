import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mafia",
  description: "Real-time multiplayer Mafia party game",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-bg text-text antialiased">{children}</body>
    </html>
  );
}
