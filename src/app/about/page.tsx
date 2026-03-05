'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Cpu, Users, Activity, GraduationCap, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'
import { ScrollReveal } from '@/components/ui/scroll-reveal'

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 overflow-hidden font-sans">
            {/* Hero Section */}
            {/* Hero Section */}
            <section className="relative pt-24 md:pt-28 pb-16 md:pb-24 px-4 overflow-hidden">
                <div className="absolute inset-0 bg-blue-600/5 dark:bg-blue-500/5 pointer-events-none" />
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-40 -left-20 w-72 h-72 bg-purple-500/10 dark:bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

                <div className="container mx-auto max-w-5xl relative z-10 text-center">
                    <ScrollReveal>
                        <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm font-semibold bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 pointer-events-none uppercase tracking-wide">
                            Discover Who We Are
                        </Badge>
                    </ScrollReveal>
                    <ScrollReveal delay={0.1}>
                        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 text-slate-900 dark:text-white leading-tight">
                            Pioneering the Future of <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 drop-shadow-sm">
                                Systems & Cybernetics
                            </span>
                        </h1>
                    </ScrollReveal>
                    <ScrollReveal delay={0.2}>
                        <p className="text-lg md:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
                            We are the IEEE Systems, Man, and Cybernetics Society Student Branch Chapter at Kalasalingam Academy of Research and Education.
                        </p>
                    </ScrollReveal>
                </div>
            </section>

            {/* Mission Section */}
            <section className="py-12 md:py-24 px-4 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 relative z-20 shadow-sm">
                <div className="container mx-auto max-w-5xl">
                    <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                        <ScrollReveal>
                            <div className="space-y-6">
                                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white relative">
                                    Our Mission
                                </h2>
                                <div className="h-1.5 w-24 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 rounded-full"></div>
                                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed text-justify">
                                    To promote the theory, practice, and interdisciplinary aspects of systems science and engineering,
                                    human-machine systems, and cybernetics. As a proud student branch, we aim to bridge the gap between
                                    academic learning and industry application in these cutting-edge fields.
                                </p>
                            </div>
                        </ScrollReveal>
                        <ScrollReveal delay={0.2}>
                            <div className="grid grid-cols-2 gap-4 md:gap-6 h-full items-center pl-0 md:pl-8">
                                <div className="bg-blue-50 dark:bg-blue-900/10 p-4 md:p-8 rounded-[2rem] border border-blue-100 dark:border-blue-800/30 text-center shadow-inner hover:-translate-y-2 transition-transform h-full flex flex-col justify-center min-h-[140px] md:min-h-[180px]">
                                    <h3 className="text-3xl md:text-5xl font-black text-blue-600 dark:text-blue-400 mb-1 md:mb-3">60+</h3>
                                    <p className="text-[10px] md:text-sm font-bold text-blue-800 dark:text-blue-300 uppercase tracking-widest">Active Minds</p>
                                </div>
                                <div className="bg-purple-50 dark:bg-purple-900/10 p-4 md:p-8 rounded-[2rem] border border-purple-100 dark:border-purple-800/30 text-center shadow-inner hover:-translate-y-2 transition-transform h-full flex flex-col justify-center min-h-[140px] md:min-h-[180px]">
                                    <h3 className="text-3xl md:text-5xl font-black text-purple-600 dark:text-purple-400 mb-1 md:mb-3">1</h3>
                                    <p className="text-[10px] md:text-sm font-bold text-purple-800 dark:text-purple-300 uppercase tracking-widest">Event Hosted</p>
                                </div>
                            </div>
                        </ScrollReveal>
                    </div>
                </div>
            </section>

            {/* Domains Section */}
            <section className="py-12 md:py-28 px-4 container mx-auto max-w-6xl">
                <ScrollReveal>
                    <div className="text-center mb-12 md:mb-16 max-w-2xl mx-auto">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-4 md:mb-6">Core Domains</h2>
                        <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 font-medium">
                            Our chapter focuses relentlessly on three primary pillars of technological advancement and socio-technical research.
                        </p>
                    </div>
                </ScrollReveal>

                <div className="grid md:grid-cols-3 gap-8">
                    <ScrollReveal delay={0.1}>
                        <motion.div whileHover={{ y: -8 }} className="h-full">
                            <Card className="h-full bg-white dark:bg-slate-900 border-2 rounded-3xl hover:border-blue-500/40 transition-colors shadow-lg shadow-slate-200/50 dark:shadow-none overflow-hidden group">
                                <CardContent className="p-8">
                                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-blue-600 transition-colors duration-300 shadow-inner">
                                        <Cpu className="w-8 h-8 text-blue-600 dark:text-blue-400 group-hover:text-white transition-colors duration-300" />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">Systems</h3>
                                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-justify text-sm sm:text-base">
                                        Focusing fiercely on systems engineering, large-scale systems, and the intelligent integration of complex technologies to solve real-world industrial challenges at scale.
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </ScrollReveal>

                    <ScrollReveal delay={0.2}>
                        <motion.div whileHover={{ y: -8 }} className="h-full">
                            <Card className="h-full bg-white dark:bg-slate-900 border-2 rounded-3xl hover:border-purple-500/40 transition-colors shadow-lg shadow-slate-200/50 dark:shadow-none overflow-hidden group">
                                <CardContent className="p-8">
                                    <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-purple-600 transition-colors duration-300 shadow-inner">
                                        <Users className="w-8 h-8 text-purple-600 dark:text-purple-400 group-hover:text-white transition-colors duration-300" />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">Human-Machine</h3>
                                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-justify text-sm sm:text-base">
                                        Emphasizing empirical human factors, ergonomics, and cognitive engineering to drastically improve the interaction and symbiosis between humans and technology.
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </ScrollReveal>

                    <ScrollReveal delay={0.3}>
                        <motion.div whileHover={{ y: -8 }} className="h-full">
                            <Card className="h-full bg-white dark:bg-slate-900 border-2 rounded-3xl hover:border-emerald-500/40 transition-colors shadow-lg shadow-slate-200/50 dark:shadow-none overflow-hidden group">
                                <CardContent className="p-8">
                                    <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-emerald-600 transition-colors duration-300 shadow-inner">
                                        <Activity className="w-8 h-8 text-emerald-600 dark:text-emerald-400 group-hover:text-white transition-colors duration-300" />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">Cybernetics</h3>
                                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-justify text-sm sm:text-base">
                                        Exploring rapid communication and control in machines and living organisms, covering artificial intelligence, machine learning, and advanced robotics.
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </ScrollReveal>
                </div>
            </section>

            {/* About KARE Section */}
            <section className="py-12 md:py-24 px-4 bg-slate-100 dark:bg-slate-900/50">
                <div className="container mx-auto max-w-5xl">
                    <ScrollReveal>
                        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-14 shadow-2xl shadow-slate-200/40 dark:shadow-none border border-slate-200/50 dark:border-slate-800">
                            <div className="flex flex-col md:flex-row gap-8 md:gap-16 items-center">
                                <div className="w-full md:w-1/3 flex justify-center">
                                    <div className="w-32 h-32 md:w-64 md:h-64 bg-slate-50 dark:bg-slate-800 rounded-full flex flex-col items-center justify-center border-[8px] md:border-[12px] border-white dark:border-slate-950 shadow-2xl relative">
                                        <GraduationCap className="w-12 h-12 md:w-24 md:h-24 text-blue-600 dark:text-blue-400 mb-1" />
                                        <div className="absolute -bottom-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 md:px-5 md:py-2.5 rounded-full text-[10px] md:text-sm font-bold flex items-center shadow-lg uppercase tracking-wider">
                                            <MapPin className="w-3 h-3 md:w-4 md:h-4 mr-2" /> Krishnankoil
                                        </div>
                                    </div>
                                </div>
                                <div className="w-full md:w-2/3 space-y-6">
                                    <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">Our Home: KARE</h2>
                                    <div className="h-1 w-16 bg-blue-500 rounded-full"></div>
                                    <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 text-justify leading-relaxed">
                                        Kalasalingam Academy of Research and Education (KARE), formerly Arulmigu Kalasalingam College of Engineering,
                                        is situated proudly at Krishnankoil, Tamil Nadu, India. It offers a spectacular range of undergraduate, postgraduate,
                                        and doctoral programs spanning Engineering, Science, Technology, and Humanities.
                                    </p>
                                    <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 text-justify leading-relaxed">
                                        The IEEE Student Branch at KARE is recognized as one of the most vibrant and active in the region.
                                        It provides an unparalleled platform for ambitious students to enhance their technical prowess and build a formidable professional network globally.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </ScrollReveal>
                </div>
            </section>
        </div>
    )
}
