import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import SiteHeaderClient from "@/components/site-header-client";
import { cn } from "@/lib/utils";
import NextTopLoader from 'nextjs-toploader';
import { ScrollProgress } from '@/components/scroll-progress';
import { getCurrentProfile } from "@/lib/auth";

export const metadata: Metadata = {
  title: "IEEE SMC Student Branch - KARE",
  description: "Official Event Management Portal for IEEE SMC Student Branch at Kalasalingam Academy of Research and Education.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await getCurrentProfile();

  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
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
        <ScrollProgress />
        <div className="print:hidden">
          <SiteHeaderClient profile={profile} />
        </div>
        <main>{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
