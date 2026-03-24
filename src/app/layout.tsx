import { Providers } from "@/components/providers";
import { Sidebar } from "@/components/sidebar";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LLM Nonsense",
  description: "And App for LLM Roleplay Nonsense",
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
              <div className="min-h-screen bg-background">{children}</div>
            </main>
            <Toaster />
          </div>
        </Providers>
      </body>
    </html>
  );
}
