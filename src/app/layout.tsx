import type { Metadata } from "next";

import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";

import { Providers } from "@/components/providers";
import { Sidebar } from "@/components/sidebar";

import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  description: "And App for LLM Roleplay Nonsense",
  title: "LLM Nonsense",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <div className="flex h-screen">
            <Sidebar />

            <main className="flex-1 overflow-auto">
              <div className="bg-background">{children}</div>
            </main>
            <Toaster />
          </div>
        </Providers>
      </body>
    </html>
  );
}
