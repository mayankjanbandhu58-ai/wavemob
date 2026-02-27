import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Wavelength AI — Chest X-Ray Analysis",
    description:
        "AI-powered chest X-ray screening for rapid clinical decision support. Offline mobile demo.",
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: "#ffffff",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className="font-sans antialiased bg-white text-slate-900">
                {children}
            </body>
        </html>
    );
}
