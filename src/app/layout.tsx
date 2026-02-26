import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import SiteHeader from "@/components/site-header";
import { cn } from "@/lib/utils";
import NextTopLoader from 'nextjs-toploader';

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
      <body className={cn("font-sans min-h-screen bg-background antialiased")} suppressHydrationWarning>
        <NextTopLoader
          color="#2563eb"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #2563eb,0 0 5px #2563eb"
          zIndex={1600}
          showAtBottom={false}
        />
        <SiteHeader />
        <main>{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
