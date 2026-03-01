"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Globe, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

import { AuroraBackground } from "./aurora-background"

export function AnimatedHero() {
    return (
        <AuroraBackground>
            <motion.div
                initial={{ opacity: 0.0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{
                    delay: 0.2,
                    duration: 0.8,
                    ease: "easeOut",
                }}
                className="relative flex flex-col gap-4 items-center justify-center px-4 min-h-[90vh]"
            >
                <div className="container relative z-10 px-4 text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="mb-12 relative inline-block"
                    >
                        <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full" />
                        <motion.div
                            animate={{ y: [0, -20, 0] }}
                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                            className="relative w-64 h-64 md:w-96 md:h-96 mx-auto rounded-[3rem] overflow-hidden shadow-2xl border border-white/20"
                        >
                            <img
                                src="/homepage_hero_illustration.jpeg"
                                alt="Innovation Hub"
                                className="w-full h-full object-cover"
                            />
                        </motion.div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="space-y-6"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-widest mb-4">
                            <Sparkles className="w-4 h-4" /> Empowering Next-Gen Innovators
                        </div>

                        <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-8 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-400 dark:from-white dark:via-white dark:to-slate-500 bg-clip-text text-transparent leading-[0.9]">
                            IEEE SMC <br /> <span className="text-blue-600">Student Branch.</span>
                        </h1>

                        <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
                            Kalasalingam Academy of Research and Education. <br className="hidden md:block" />
                            Bridging the gap between <span className="text-slate-900 dark:text-white font-bold">humans</span>, <span className="text-slate-900 dark:text-white font-bold">machines</span>, and <span className="text-slate-900 dark:text-white font-bold">systems</span>.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="flex flex-col sm:flex-row justify-center gap-4"
                    >
                        <Button size="lg" asChild className="h-14 px-10 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-xl shadow-blue-600/20 transition-all active:scale-95 group">
                            <Link href="/events">
                                Explore Events <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </Button>
                        <Button size="lg" variant="outline" asChild className="h-14 px-10 rounded-2xl border-slate-200 dark:border-slate-800 bg-white/50 backdrop-blur-md font-bold text-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-all active:scale-95">
                            <Link href="/status">
                                Check Status
                            </Link>
                        </Button>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 1 }}
                    className="absolute bottom-12 flex items-center gap-8 text-xs font-bold text-slate-400 uppercase tracking-[0.2em]"
                >
                    <div className="flex items-center gap-2"><Globe className="w-4 h-4" /> Global Network</div>
                    <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> IEEE Trusted</div>
                </motion.div>
            </motion.div>
        </AuroraBackground>
    )
}
