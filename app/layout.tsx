import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import ClientErrorRoot from "@/components/ClientErrorRoot";
import { GoogleRedirectComplete } from "@/components/GoogleRedirectComplete";

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Build with AI Hackathon — Google I/O 2026 | GDG London",
  description:
    "Build with AI × Google I/O 2026 — GDG London. Create, ship, and showcase your AI project. Use any AI technology.",
  icons: {
    icon: "/io-logo.png",
    apple: "/io-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.variable} font-sans antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            <GoogleRedirectComplete />
            <ClientErrorRoot>{children}</ClientErrorRoot>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

