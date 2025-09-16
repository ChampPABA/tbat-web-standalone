import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { WebVitalsReporter } from "@/components/web-vitals-reporter";
import { Toaster } from "@/components/ui/sonner";
import { AuthProviders } from "@/providers/auth-providers";
import "./globals.css";
import "../styles/print.css";

const prompt = Prompt({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-prompt",
});

export const metadata: Metadata = {
  title: "TBAT Mock Exam Platform",
  description:
    "Thai Biomedical Admissions Test (TBAT) mock examination platform for Chiang Mai region",
  other: {
    charset: "utf-8",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={`${prompt.variable} font-prompt`}>
        <AuthProviders>
          {children}
        </AuthProviders>
        <Toaster />
        <WebVitalsReporter />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
