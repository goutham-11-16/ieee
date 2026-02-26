import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Calendar, Users, Award } from 'lucide-react'
import { Suspense } from 'react'
import { FeaturedEvents } from '@/components/home/featured-events'
import { FeaturedEventsSkeleton } from '@/components/home/featured-events-skeleton'
import { AnimatedHero } from "@/components/ui/animated-hero"
import { StatsSection } from "@/components/home/stats-section"
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid"
import { FloatingNav } from "@/components/ui/floating-navbar"
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards"

const navItems = [
  { name: "Home", link: "/", icon: <ArrowRight className="h-4 w-4" /> },
  { name: "Events", link: "/events", icon: <Calendar className="h-4 w-4" /> },
  { name: "About", link: "/about", icon: <Users className="h-4 w-4" /> },
  { name: "Team", link: "/team", icon: <Users className="h-4 w-4" /> },
  { name: "Contact", link: "/contact", icon: <ArrowRight className="h-4 w-4" /> }
]

const testimonials = [
  {
    quote: "Joining IEEE SMC was the best decision of my academic career. The workshops are incredibly insightful and the community is very supportive.",
    name: "Alex Johnson",
    title: "Computer Science Student",
  },
  {
    quote: "The automated certificate system and seamless event registration makes participating in events so much easier. Highly professional setup!",
    name: "Sarah Williams",
    title: "Engineering Graduate",
  },
  {
    quote: "I've learned so much about cybernetics and systems engineering through the seminars hosted here. The speakers are always top-notch.",
    name: "Michael Chen",
    title: "AI Researcher",
  },
  {
    quote: "An amazing platform that connects students with industry professionals. The networking opportunities provided are unparalleled.",
    name: "Emily Rodriguez",
    title: "Systems Engineer",
  },
  {
    quote: "The leadership opportunities within the student chapter have helped me grow both personally and professionally.",
    name: "David Smith",
    title: "Chapter Chair",
  },
];

export default async function Home() {


  return (
    <div className="flex flex-col min-h-screen relative">
      <FloatingNav navItems={navItems} />

      {/* Hero Section */}
      <AnimatedHero />

      {/* Stats Section */}
      <StatsSection />

      {/* Featured Events Section */}
      <Suspense fallback={<FeaturedEventsSkeleton />}>
        <FeaturedEvents />
      </Suspense>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-slate-900 border-y relative z-10">
        <div className="container px-4">
          <ScrollReveal>
            <h2 className="text-3xl font-bold text-center mb-16">Why Choose IEEE SMC?</h2>
          </ScrollReveal>
          <BentoGrid className="max-w-4xl mx-auto">
            <BentoGridItem
              title="Seamless Booking"
              description="Browse and register for upcoming events in seconds. Get instant confirmations and digital tickets."
              header={<div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 items-center justify-center"><Calendar className="h-12 w-12 text-blue-500" /></div>}
              className="md:col-span-1"
            />
            <BentoGridItem
              title="Automated Certificates"
              description="Receive verified digital certificates immediately after attending workshops and seminars."
              header={<div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 items-center justify-center"><Award className="h-12 w-12 text-purple-500" /></div>}
              className="md:col-span-1"
            />
            <BentoGridItem
              title="Community Hub"
              description="Connect with peers, track your participation history, and manage your club profile."
              header={<div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 items-center justify-center"><Users className="h-12 w-12 text-emerald-500" /></div>}
              className="md:col-span-1"
            />
          </BentoGrid>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white dark:bg-slate-950 overflow-hidden relative flex flex-col items-center justify-center">
        <ScrollReveal>
          <h2 className="text-3xl font-bold text-center mb-16 z-10 relative">What Our Members Say</h2>
        </ScrollReveal>
        <div className="w-full relative flex flex-col items-center justify-center overflow-hidden">
          <InfiniteMovingCards
            items={testimonials}
            direction="right"
            speed="slow"
          />
        </div>
      </section>

      {/* Footer */}
      < footer className="py-12 bg-white dark:bg-slate-950" >
        <div className="container px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-8 mb-6">
                <img
                  src="https://i.ibb.co/yFsM0hzC/Gemini-Generated-Image-lb3h34lb3h34lb3h.png"
                  alt="IEEE SMC KARE Logo"
                  className="h-40 w-auto object-contain rounded-lg"
                />
              </div>
              <span className="text-3xl font-bold tracking-tight">IEEE SMC - KARE</span>
              <p className="mt-4 text-muted-foreground max-w-xs">
                To promote the theory, practice, and interdisciplinary aspects of systems science and engineering, human-machine systems, and cybernetics.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/events" className="hover:text-primary">Events</Link></li>
                <li><Link href="/about" className="hover:text-primary">About Us</Link></li>
                <li><Link href="/team" className="hover:text-primary">Team</Link></li>
                <li><Link href="/contact" className="hover:text-primary">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="#" className="hover:text-primary">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-primary">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t text-center text-muted-foreground text-sm">
            <p>© {new Date().getFullYear()} IEEE SMC Student Branch - Kalasalingam Academy of Research and Education. All rights reserved.</p>
          </div>
        </div>
      </footer >
    </div >
  )
}


