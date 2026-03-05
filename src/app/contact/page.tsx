"use client"

import { AuroraBackground } from "@/components/ui/aurora-background"
import { motion } from "framer-motion"
import { Mail, MapPin, Phone, Linkedin, Instagram, ArrowRight, MessageSquare, Globe } from 'lucide-react'
import Link from 'next/link'
import { ScrollReveal } from "@/components/ui/scroll-reveal"

export default function ContactPage() {
    return (
        <AuroraBackground className="min-h-screen">
            <div className="container mx-auto pt-24 pb-20 md:pt-28 px-4 relative z-10">
                <ScrollReveal>
                    <div className="text-center mb-16">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-widest mb-6"
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            Connect With Us
                        </motion.div>
                        <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
                            Let&apos;s Build the <br className="hidden md:block" /> Future Together.
                        </h1>
                        <p className="text-base md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                            Have an idea, inquiry, or just want to say hello? Our team is ready to collaborate and innovate with you.
                        </p>
                    </div>
                </ScrollReveal>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 max-w-6xl mx-auto items-start">
                    {/* Left Column: Direct Contact */}
                    <ScrollReveal delay={0.1}>
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-3">
                                <div className="h-8 w-1 bg-blue-600 rounded-full" />
                                Contact Information
                            </h2>

                            <div className="group p-5 md:p-6 rounded-3xl bg-white/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-md hover:border-blue-500/30 transition-all duration-300">
                                <div className="flex items-start gap-3 md:gap-4">
                                    <div className="p-2.5 md:p-3 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                        <Mail className="h-5 w-5 md:h-6 md:w-6" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-slate-900 dark:text-white text-sm md:text-base">Email Address</h3>
                                        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mb-1.5 md:mb-2">Our official communication channel.</p>
                                        <a href="mailto:kareieeesmc@gmail.com" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline decoration-2 underline-offset-4 text-sm md:text-base break-all">
                                            kareieeesmc@gmail.com
                                        </a>
                                    </div>
                                </div>
                            </div>

                            <div className="group p-6 rounded-3xl bg-white/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-md hover:border-emerald-500/30 transition-all duration-300">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                                        <Phone className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white">Phone Number</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Available Mon-Fri, 9am - 5pm.</p>
                                        <a href="tel:+919281401356" className="text-slate-900 dark:text-white font-bold hover:text-blue-600 transition-colors">
                                            +91 9281401356
                                        </a>
                                    </div>
                                </div>
                            </div>

                            <div className="group p-6 rounded-3xl bg-white/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-md hover:border-purple-500/30 transition-all duration-300">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                                        <MapPin className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white">Our Location</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Drop by the chapter office.</p>
                                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                            IEEE SMC Student Branch<br />
                                            Kalasalingam Academy of Research and Education<br />
                                            Krishnankoil, Tamil Nadu 626126
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ScrollReveal>

                    {/* Right Column: Socials & Modern Interaction */}
                    <ScrollReveal delay={0.2}>
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-3">
                                <div className="h-8 w-1 bg-pink-600 rounded-full" />
                                Follow Our Journey
                            </h2>

                            <div className="grid grid-cols-2 gap-3 md:gap-4">
                                <Link
                                    href="https://www.linkedin.com/company/kare-ieee-smc-society/"
                                    target="_blank"
                                    className="group p-4 md:p-6 rounded-3xl bg-white/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-md hover:bg-white dark:hover:bg-slate-800 transition-all duration-300 flex flex-col items-center text-center gap-3 md:gap-4"
                                >
                                    <div className="p-3 md:p-4 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform">
                                        <Linkedin className="h-5 w-5 md:h-6 md:w-6" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-slate-900 dark:text-white text-sm md:text-base">LinkedIn</h3>
                                        <span className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 block truncate">Professional Hub</span>
                                    </div>
                                    <ArrowRight className="h-4 w-4 md:h-5 md:w-5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                                </Link>

                                <Link
                                    href="https://www.instagram.com/ieeesmc_kare?igsh=cTlnaGgyY2k0NXNu"
                                    target="_blank"
                                    className="group p-4 md:p-6 rounded-3xl bg-white/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-md hover:bg-white dark:hover:bg-slate-800 transition-all duration-300 flex flex-col items-center text-center gap-3 md:gap-4"
                                >
                                    <div className="p-3 md:p-4 rounded-2xl bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/20 group-hover:scale-110 transition-transform">
                                        <Instagram className="h-5 w-5 md:h-6 md:w-6" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-slate-900 dark:text-white text-sm md:text-base">Instagram</h3>
                                        <span className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 block truncate">Snapshots</span>
                                    </div>
                                    <ArrowRight className="h-4 w-4 md:h-5 md:w-5 text-slate-300 group-hover:text-pink-600 group-hover:translate-x-1 transition-all" />
                                </Link>
                            </div>

                            <div className="p-8 rounded-[2.5rem] bg-slate-900 text-white overflow-hidden relative group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-bl-full blur-2xl" />
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-600/10 rounded-tr-full blur-2xl" />

                                <div className="relative z-10">
                                    <div className="inline-flex p-3 rounded-2xl bg-white/10 mb-6 backdrop-blur-sm">
                                        <MessageSquare className="h-6 w-6 text-blue-400" />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-4">Want to partner with us?</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed mb-6">
                                        We are always open to collaborations, sponsored workshops, and industry partnerships that empower our student community.
                                    </p>
                                    <Link
                                        href="mailto:kareieeesmc@gmail.com?subject=Partnership Inquiry"
                                        className="inline-flex items-center gap-2 font-bold text-blue-400 hover:text-blue-300 transition-colors group/link"
                                    >
                                        Send Proposal <ArrowRight className="h-4 w-4 group-hover/link:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </ScrollReveal>
                </div>
            </div>
        </AuroraBackground>
    )
}
