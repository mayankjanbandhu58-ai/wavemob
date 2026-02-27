import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Wavelength AI — Chest X-Ray Clinical Decision Support",
  description:
    "AI-powered multi-disease chest X-ray screening system for clinical decision support. Detects 8 conditions with calibrated probabilities, uncertainty estimation, and explainable heatmaps.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-[#fdfcfa] text-[#1a1c29]`}>
        {children}
      </body>
    </html>
  );
}
