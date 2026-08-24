// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "next-themes";
import ClientLayout from "./ClientLayout";
import { QueryProvider } from "@/lib/providers/query-provider";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "TaskFlow - Task Management System",
    template: "%s | TaskFlow",
  },
  description: "Streamline your workflow with TaskFlow - A modern task management system for teams and individuals. Manage projects, track tasks, and boost productivity.",
  keywords: [
    "task management",
    "project management",
    "productivity",
    "team collaboration",
    "task tracking",
    "workflow management",
    "agile",
    "kanban",
  ],
  authors: [
    {
      name: "TaskFlow Team",
      url: "https://taskflow.com",
    },
  ],
  creator: "TaskFlow",
  publisher: "TaskFlow",
  metadataBase: new URL("https://taskflow.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://taskflow.com",
    title: "TaskFlow - Task Management System",
    description: "Streamline your workflow with TaskFlow - A modern task management system for teams and individuals.",
    siteName: "TaskFlow",
    images: [
      {
        url: "/favicon.svg",
        width: 1200,
        height: 630,
        alt: "TaskFlow - Task Management System",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TaskFlow - Task Management System",
    description: "Streamline your workflow with TaskFlow - A modern task management system for teams and individuals.",
    images: ["/favicon.svg"],
    creator: "@taskflow",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.svg", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/safari-pinned-tab.svg",
        color: "#3B82F6",
      },
    ],
  },
  manifest: "/site.webmanifest",
  verification: {
    google: "your-google-verification-code",
  },
  category: "Productivity",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        inter.variable
      )}
      suppressHydrationWarning
    >
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <body className="min-h-full flex flex-col bg-gray-50 dark:bg-gray-950">
          <QueryProvider>
            <ClientLayout>{children}</ClientLayout>
          </QueryProvider>
        </body>
      </ThemeProvider>
    </html>
  );
}