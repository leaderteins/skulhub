import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { GoogleAnalytics } from "@/components/google-analytics";
import { StructuredData } from "@/components/structured-data";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SkulHub — School Management System",
  description: "Professional school, college & university management system. Built for Kenyan institutions, scalable worldwide.",
  keywords: ["school management system Kenya", "school management software", "CBE Kenya", "Competency Based Education", "M-Pesa school fees", "parent portal Kenya", "school report cards", "attendance tracking", "fee management system", "biometric attendance", "school SMS Kenya", "JESMA exam papers", "KNEC past papers", "CBC Kenya", "school administration software", "education management system", "Kenya school software", "school ERP Kenya", "student information system", "school management ERP"],
  authors: [{ name: "SkulHub" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "SkulHub",
    description: "World-class school management system for Kenya and beyond",
    siteName: "SkulHub",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <StructuredData />
          {children}
          <GoogleAnalytics />
          <Toaster />
          <SonnerToaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}

