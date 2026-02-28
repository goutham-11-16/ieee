import { AnimatedHero } from '@/components/ui/animated-hero'
import { BentoStats } from '@/components/home/bento-stats'
import { FeaturesSection } from '@/components/home/features-section'
import { FeaturedEvents } from '@/components/home/featured-events'
import { CTASection } from '@/components/home/cta-section'
import { SiteFooter } from '@/components/site-footer'
import { Suspense } from 'react'
import { FeaturedEventsSkeleton } from '@/components/home/featured-events-skeleton'

export default async function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 selection:bg-blue-100 dark:selection:bg-blue-900/30 overflow-x-hidden">
      <div className="relative">
        <AnimatedHero />

        <section id="stats" className="relative z-10 -mt-20 md:-mt-32">
          <BentoStats />
        </section>

        <div className="py-24 space-y-32">
          <Suspense fallback={<FeaturedEventsSkeleton />}>
            <FeaturedEvents />
          </Suspense>

          <FeaturesSection />

          <CTASection />
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}


