'use client'

import { login } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { useActionState, useState } from 'react'
import { Loader2, Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function LoginPage() {
    const [state, formAction, isPending] = useActionState(login as any, undefined as any)
    const [showPassword, setShowPassword] = useState(false)

    return (
        <div className="flex min-h-screen w-full overflow-hidden bg-[#fdfdfd] dark:bg-slate-950">
            {/* Desktop Hero Section */}
            <div className="hidden lg:flex w-1/2 relative bg-slate-50 dark:bg-slate-900 items-center justify-center p-12 overflow-hidden border-r border-slate-200 dark:border-slate-800">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-400/10 rounded-full blur-[120px]" />
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="relative z-10 w-full max-w-lg space-y-8 text-center"
                >
                    <div className="relative group">
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                            className="relative mx-auto w-80 h-80 rounded-3xl overflow-hidden shadow-2xl border border-white/20"
                        >
                            <img
                                src="/login_hero_illustration_1772304620610.jpeg"
                                alt="Innovation Hub"
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                        </motion.div>
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
                            IEEE SMC Student Branch
                        </h1>
                        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                            Empowering innovation and technical excellence at <span className="text-blue-600 font-semibold">KARE</span>.
                        </p>
                    </div>

                    <div className="flex items-center justify-center gap-2 py-4">
                        <div className="flex -space-x-3 overflow-hidden">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="inline-block h-10 w-10 rounded-full ring-4 ring-slate-50 dark:ring-slate-900 bg-slate-200 dark:bg-slate-800 border border-slate-300 flex items-center justify-center overflow-hidden">
                                    <span className="text-[10px] font-bold text-slate-500">IEEE</span>
                                </div>
                            ))}
                        </div>
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400 ml-2">
                            Join 500+ active student members
                        </span>
                    </div>
                </motion.div>

                <div className="absolute bottom-8 text-slate-400 dark:text-slate-600 text-sm flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> Secure Enterprise Infrastructure
                </div>
            </div>

            {/* Login Form Section */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="w-full max-w-md"
                >
                    <div className="lg:hidden mb-12 text-center space-y-4">
                        <div className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <span className="text-white font-bold text-2xl">I</span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">IEEE SMC - KARE</h2>
                    </div>

                    <Card className="border-none shadow-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-slate-200 dark:ring-slate-800">
                        <CardHeader className="space-y-2 pb-8">
                            <CardTitle className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Welcome back</CardTitle>
                            <CardDescription className="text-slate-500 dark:text-slate-400 text-base">
                                Access the Event Management Portal
                            </CardDescription>
                        </CardHeader>

                        <form action={formAction}>
                            <CardContent className="space-y-6">
                                <AnimatePresence mode="wait">
                                    {state?.error && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="p-4 bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 rounded-xl text-sm border border-rose-100 dark:border-rose-900/20 flex items-center gap-3 overflow-hidden"
                                        >
                                            <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-rose-500" />
                                            {state.error}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Email Address</Label>
                                        <div className="relative group">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                                <Mail className="w-5 h-5" />
                                            </div>
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                placeholder="m@example.com"
                                                required
                                                className="pl-11 h-12 bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all rounded-xl"
                                                disabled={isPending}
                                                suppressHydrationWarning
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center px-1">
                                            <Label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Password</Label>
                                            <button
                                                type="button"
                                                className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? "Hide password" : "Show password"}
                                            </button>
                                        </div>
                                        <div className="relative group">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                                <Lock className="w-5 h-5" />
                                            </div>
                                            <Input
                                                id="password"
                                                name="password"
                                                type={showPassword ? "text" : "password"}
                                                required
                                                className="pl-11 pr-11 h-12 bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all rounded-xl"
                                                disabled={isPending}
                                                suppressHydrationWarning
                                            />
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                                                {showPassword ? <EyeOff className="w-4 h-4 cursor-pointer" onClick={() => setShowPassword(false)} /> : <Eye className="w-4 h-4 cursor-pointer" onClick={() => setShowPassword(true)} />}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>

                            <CardFooter className="flex flex-col space-y-6 pt-2">
                                <Button
                                    className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-xl shadow-blue-600/20 active:scale-[0.98] transition-all group"
                                    type="submit"
                                    disabled={isPending}
                                    suppressHydrationWarning
                                >
                                    {isPending ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            <span>Verifying credentials...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span>Continue to Portal</span>
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    )}
                                </Button>

                                <div className="space-y-4 text-center">
                                    <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
                                        <span className="w-8 h-[1px] bg-slate-200 dark:bg-slate-800" />
                                        <span>Portal Assistance</span>
                                        <span className="w-8 h-[1px] bg-slate-200 dark:bg-slate-800" />
                                    </div>
                                    <p className="text-xs text-muted-foreground bg-slate-100 dark:bg-slate-800/50 py-3 px-4 rounded-lg inline-block">
                                        Need an account? Please contact your <span className="font-semibold text-slate-900 dark:text-slate-200">IEEE SMC Administrator</span>.
                                    </p>
                                </div>
                            </CardFooter>
                        </form>
                    </Card>

                    <footer className="mt-8 text-center text-slate-400 dark:text-slate-600 text-xs tracking-tight">
                        &copy; 2026 IEEE SMC Student Branch - KARE. Authorized Access Only.
                    </footer>
                </motion.div>
            </div>
        </div>
    )
}
