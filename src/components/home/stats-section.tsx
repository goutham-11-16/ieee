"use client"

import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { Users, Calendar, Award, Globe } from "lucide-react"

const stats = [
    { label: "Active Members", value: "500+", icon: Users, color: "text-blue-500" },
    { label: "Events Hosted", value: "50+", icon: Calendar, color: "text-emerald-500" },
    { label: "Certificates Issued", value: "1200+", icon: Award, color: "text-purple-500" },
    { label: "Global Reach", value: "10+", icon: Globe, color: "text-orange-500" },
]

export function StatsSection() {
    return (
        <section className="py-20 bg-slate-50 dark:bg-slate-900 border-y relative overflow-hidden">
            <div className="container px-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {stats.map((stat, index) => (
                        <ScrollReveal key={index} delay={index * 0.1} width="100%">
                            <div className="text-center p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 border border-slate-100 dark:border-slate-700 group">
                                <div className={`inline-flex p-3 rounded-xl bg-opacity-10 dark:bg-opacity-20 mb-4 group-hover:scale-110 transition-transform duration-300 ${stat.color.replace('text-', 'bg-')}`}>
                                    <stat.icon className={`h-8 w-8 ${stat.color}`} />
                                </div>
                                <div className="text-4xl font-extrabold mb-1 bg-clip-text text-transparent bg-gradient-to-br from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                                    {stat.value}
                                </div>
                                <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                    {stat.label}
                                </div>
                            </div>
                        </ScrollReveal>
                    ))}
                </div>
            </div>
        </section>
    )
}
