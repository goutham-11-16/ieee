import type { Metadata } from "next";
import { Inter } from "next/font/google"; // using Inter instead of local font for simplicity/speed
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import SiteHeader from "@/components/site-header";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "IEEE SMC Student Branch - KARE",
  description: "Official Event Management Portal for IEEE SMC Student Branch at Kalasalingam Academy of Research and Education.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn(inter.className, "min-h-screen bg-background antialiased")} suppressHydrationWarning>
        <SiteHeader />
        <main>{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
