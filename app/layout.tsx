import {ClerkProvider} from "@clerk/nextjs";
import type { Metadata } from "next";
import { Hanken_Grotesk, JetBrains_Mono, Archivo_Narrow } from "next/font/google";
import { dark } from "@clerk/themes";
import "./globals.css";

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["500", "700"],
});

const archivo = Archivo_Narrow({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "Rewind — Time-Travel Debugging",
  description: "Every database mutation, captured as an immutable event. Scrub through time, diff any two moments, and reconstruct state at any millisecond.",
  openGraph: {
    title: "Rewind — Time-Travel Debugging",
    description: "Every mutation captured. Scrub through time, diff any two moments, and reconstruct state at any millisecond.",
    type: "website",
    images: ["/opengraph-image.svg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rewind — Time-Travel Debugging",
    description: "Every mutation captured. Scrub through time, diff any two moments, and reconstruct state at any millisecond.",
    images: ["/opengraph-image.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${hanken.variable} ${jetbrains.variable} ${archivo.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap" />
        <script dangerouslySetInnerHTML={{ __html: `document.fonts.ready.then(function(){document.documentElement.classList.add("fonts-ready")})` }} />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        {/* @ts-expect-error Clerk theme type mismatch between versions */}
        <ClerkProvider appearance={{ baseTheme: dark }}>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}