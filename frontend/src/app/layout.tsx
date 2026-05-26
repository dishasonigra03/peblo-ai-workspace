import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientWrapper from "@/components/ClientWrapper";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "PEBLO | AI-Powered Collaborative Notes Workspace",
  description: "Accelerate your writing with instant AI summaries, action items extractors, tags sorting, public sharing, and productivity analytics.",
  keywords: ["PEBLO", "AI notes", "markdown workspace", "collaborative documentation", "action items extractor"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <ClientWrapper>{children}</ClientWrapper>
      </body>
    </html>
  );
}
