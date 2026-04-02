import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { PWARegister } from "@/components/PWARegister";
import { BackgroundScheduler } from "@/components/BackgroundScheduler";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Drill - The AI That Won't Let You Slack Off",
  description:
    "Drill is your AI accountability partner that calls you every day, remembers everything you said, and holds you to it. No excuses.",
  keywords: ["AI", "accountability", "productivity", "voice AI", "ElevenLabs", "daily tasks", "habit tracker"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Drill",
  },
  openGraph: {
    title: "Drill — Your AI Accountability Partner",
    description: "The AI that won't let you slack off.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-screen bg-[#0A0A0A] text-white font-sans">
        <AuthProvider>
          {children}
          <BackgroundScheduler />
        </AuthProvider>
        <PWARegister />
      </body>
    </html>
  );
}
