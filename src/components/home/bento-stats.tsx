"use client"

import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { Users, Calendar, Award, Globe, Rocket, Zap, Heart, Star } from "lucide-react"
import { motion } from "framer-motion"

const stats = [
    {
        label: "Active Members",
        value: "500+",
        icon: Users,
        color: "bg-blue-500",
        description: "Passionate students driving technical innovation.",
        gridClass: "md:col-span-2 md:row-span-2"
    },
    {
        label: "Events Hosted",
        value: "50+",
        icon: Calendar,
        color: "bg-emerald-500",
        description: "Engaging workshops and seminars.",
        gridClass: "md:col-span-1 md:row-span-1"
    },
    {
        label: "Certificates",
        value: "1200+",
        icon: Award,
        color: "bg-purple-500",
        description: "Verified achievements.",
        gridClass: "md:col-span-1 md:row-span-2"
    },
    {
        label: "Achievements",
        value: "15+",
        icon: Star,
        color: "bg-orange-500",
        description: "National & local recognition.",
        gridClass: "md:col-span-1 md:row-span-1"
    },
    {
        label: "Global Reach",
        value: "10+",
        icon: Globe,
        color: "bg-indigo-500",
        description: "Collaborations worldwide.",
        gridClass: "md:col-span-1 md:row-span-1"
    }
]

export function BentoStats() {
    return (
        <section className="py-12 md:py-24 bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
            <div className="container px-4 mx-auto">
                <ScrollReveal>
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
                            Our Impact at a Glance
                        </h2>
                        <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400">
                            Quantifying a year of innovation, learning, and community growth.
                        </p>
                    </div>
                </ScrollReveal>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-6">
                    {stats.map((stat, index) => (
                        <ScrollReveal key={index} delay={index * 0.1}>
                            <motion.div
                                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                                className={`h-full w-full p-8 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between overflow-hidden relative`}
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 dark:bg-slate-800/50 rounded-bl-full -z-0 opacity-50 group-hover:scale-110 transition-transform duration-500" />

                                <div className="relative z-10">
                                    <div className={`inline-flex p-3 rounded-2xl ${stat.color} text-white mb-6 shadow-lg shadow-current/10`}>
                                        <stat.icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-1">{stat.value}</h3>
                                    <p className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">{stat.label}</p>
                                </div>

                                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed relative z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                                    {stat.description}
                                </p>
                            </motion.div>
                        </ScrollReveal>
                    ))}
                </div>
            </div>
        </section>
    )
}
