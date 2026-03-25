import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/App/providers";
import { GoogleAnalytics } from "@/shared/components/GoogleAnalytics";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Sổ nợ",
  description: "Tổng quan nợ, chủ nợ và lịch sử trả nợ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${plusJakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <AppProviders>{children}</AppProviders>
        <GoogleAnalytics />
      </body>
    </html>
  );
}
