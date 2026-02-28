"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"
import { motion } from "framer-motion"

export function CTASection() {
    return (
        <section className="py-24 px-4 overflow-hidden relative">
            <div className="container mx-auto max-w-5xl">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                    className="bg-blue-600 rounded-[3rem] p-12 md:p-24 relative overflow-hidden shadow-2xl shadow-blue-500/20 text-center"
                >
                    {/* Abstract background blobs */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl -ml-32 -mb-32" />

                    <div className="relative z-10 flex flex-col items-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold uppercase tracking-widest mb-8">
                            <Sparkles className="w-4 h-4" /> Ready to participate?
                        </div>

                        <h2 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tight">
                            Elevate Your Engineering <br className="hidden md:block" /> Journey Today.
                        </h2>

                        <p className="text-blue-100 text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
                            Join our community of over 500+ active members and start attending world-class workshops and technical events.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                            <Button size="lg" asChild className="bg-white text-blue-600 hover:bg-slate-100 h-14 px-10 rounded-2xl font-bold text-lg shadow-xl shadow-black/10 transition-all active:scale-95">
                                <Link href="/events">Explore Events <ArrowRight className="ml-2 w-5 h-5" /></Link>
                            </Button>
                            <Button size="lg" variant="outline" asChild className="border-white/30 bg-white/5 text-white hover:bg-white/10 backdrop-blur-sm h-14 px-10 rounded-2xl font-bold text-lg transition-all active:scale-95">
                                <Link href="/status">Check Status</Link>
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
