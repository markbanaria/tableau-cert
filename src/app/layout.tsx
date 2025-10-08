import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Providers from "./providers";

const plusJakartaSans = localFont({
  src: [
    {
      path: './fonts/PlusJakartaSans-VariableFont_wght.ttf',
      weight: '200 800',
      style: 'normal',
    },
    {
      path: './fonts/PlusJakartaSans-Italic-VariableFont_wght.ttf',
      weight: '200 800',
      style: 'italic',
    }
  ],
  variable: '--font-plus-jakarta-sans',
  display: 'swap',
});

const ibmPlexMono = localFont({
  src: [
    {
      path: './fonts/IBMPlexMono-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: './fonts/IBMPlexMono-Bold.ttf',
      weight: '700',
      style: 'normal',
    }
  ],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "AYX",
  description: "Authentication and management platform",
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${plusJakartaSans.variable} ${ibmPlexMono.variable} ${plusJakartaSans.className} antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
