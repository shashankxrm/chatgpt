import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ClerkProvider } from '@clerk/nextjs';
import { Suspense } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChatGPT Clone",
  description: "ChatGPT Clone",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}>
          <Suspense fallback={null}>
            <ThemeProvider
              defaultTheme="system"
              storageKey="chatgpt-theme"
              attribute="class"
              enableSystem
              disableTransitionOnChange
            >
              {children}
            </ThemeProvider>
          </Suspense>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
