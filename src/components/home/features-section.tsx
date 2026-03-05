"use client"

import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { Monitor, Lightbulb, Code, BookOpen, Presentation, Users2 } from "lucide-react"
import { motion } from "framer-motion"

const features = [
    {
        title: "Technical Workshops",
        description: "Hands-on sessions on emerging technologies, AI, and Systems Engineering.",
        icon: Code,
        color: "border-blue-500/20 bg-blue-500/5"
    },
    {
        title: "Hackathons & Dev",
        description: "Intense coding marathons where students build real-world solutions.",
        icon: Lightbulb,
        color: "border-purple-500/20 bg-purple-500/5"
    },
    {
        title: "Research Activities",
        description: "Fostering academic growth through research papers and technical journals.",
        icon: BookOpen,
        color: "border-emerald-500/20 bg-emerald-500/5"
    },
    {
        title: "Industry Talks",
        description: "Connecting students with experts from leading tech organizations.",
        icon: Presentation,
        color: "border-orange-500/20 bg-orange-500/5"
    },
    {
        title: "Community Outreach",
        description: "Impactful initiatives aimed at social development through technology.",
        icon: Users2,
        color: "border-indigo-500/20 bg-indigo-500/5"
    },
    {
        title: "Advanced Systems",
        description: "Exploring complex cybernetic systems and human-machine interaction.",
        icon: Monitor,
        color: "border-rose-500/20 bg-rose-500/5"
    }
]

export function FeaturesSection() {
    return (
        <section className="py-20 bg-white dark:bg-slate-950">
            <div className="container px-4 mx-auto">
                <ScrollReveal>
                    <div className="mb-16">
                        <h2 className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3">What We Do</h2>
                        <h3 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white">
                            Driving Excellence in <br className="hidden md:block" /> Every Technical Frontier.
                        </h3>
                    </div>
                </ScrollReveal>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
                    {features.map((feature, index) => (
                        <ScrollReveal key={index} delay={index * 0.1}>
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                className={`p-5 md:p-7 rounded-[2rem] border ${feature.color} backdrop-blur-sm transition-all duration-300 h-full flex flex-col group`}
                            >
                                <div className="p-3 md:p-3.5 bg-white dark:bg-slate-900 rounded-2xl shadow-sm mb-3 md:mb-5 w-fit group-hover:shadow-md transition-shadow">
                                    <feature.icon className="h-5 w-5 md:h-5.5 md:w-5.5 text-slate-900 dark:text-white" />
                                </div>
                                <h4 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-2 md:mb-2">{feature.title}</h4>
                                <p className="text-sm md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                    {feature.description}
                                </p>
                            </motion.div>
                        </ScrollReveal>
                    ))}
                </div>
            </div>
        </section>
    )
}
