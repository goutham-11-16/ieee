'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { signout } from '@/app/auth/actions'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Menu, User, LogOut, LayoutDashboard, Search, ArrowRight, Home, Calendar, Info, Users, Mail, ChevronRight } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export default function SiteHeader({ profile }: { profile: any }) {
    const [isScrolled, setIsScrolled] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const pathname = usePathname()

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const navLinks = [
        { href: '/', label: 'Home', icon: Home },
        { href: '/events', label: 'Events', icon: Calendar },
        { href: '/about', label: 'About', icon: Info },
        { href: '/team', label: 'Teams', icon: Users },
        { href: '/contact', label: 'Contact', icon: Mail }
    ]

    return (
        <header className={cn(
            "sticky top-0 z-50 w-full transition-all duration-300",
            isScrolled ? "border-b bg-background/90 backdrop-blur-md shadow-sm h-16" : "bg-transparent border-transparent h-24"
        )}>
            <div className="container flex h-full items-center justify-between px-4 transition-all duration-300 mx-auto">
                <Link href="/" className="flex items-center gap-6">
                    <div className="flex items-center gap-4">
                        <img
                            src="https://i.ibb.co/yFsM0hzC/Gemini-Generated-Image-lb3h34lb3h34lb3h.png"
                            alt="IEEE SMC KARE Logo"
                            className={cn(
                                "object-contain transition-all duration-300 rounded-md",
                                isScrolled ? "h-10 md:h-12" : "h-16 md:h-16 lg:h-20"
                            )}
                        />
                    </div>
                </Link>

                <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "px-4 py-2 rounded-md transition-all duration-200 relative",
                                    isActive ? "text-primary font-bold" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                )}
                            >
                                {link.label}
                                {isActive && (
                                    <motion.div
                                        layoutId="nav-underline"
                                        className="absolute bottom-0 left-4 right-4 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                    />
                                )}
                            </Link>
                        )
                    })}
                    <Link
                        href="/status"
                        className="ml-4 px-6 py-2 rounded-full border border-blue-200 bg-blue-50 text-blue-600 font-bold hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
                    >
                        Status Checker
                    </Link>
                </nav>

                <div className="flex items-center gap-4">
                    {profile ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-10 w-10 rounded-full border-2 border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors shadow-sm p-0 overflow-hidden">
                                    <Avatar className="h-full w-full">
                                        <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || 'U')}&background=0D8ABC&color=fff`} />
                                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                                            {profile.full_name?.charAt(0) || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-64" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-bold leading-none">{profile.full_name}</p>
                                        <p className="text-xs leading-none text-muted-foreground">{profile.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/profile" className="cursor-pointer"><User className="mr-2 h-4 w-4" /> Profile</Link>
                                </DropdownMenuItem>
                                {['admin', 'super_admin', 'event_admin', 'finance_admin', 'content_admin', 'moderator'].includes(profile.role) && (
                                    <DropdownMenuItem asChild>
                                        <Link href="/admin" className="cursor-pointer text-blue-600 font-bold"><LayoutDashboard className="mr-2 h-4 w-4" /> Admin Dashboard</Link>
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <form action={signout} className="w-full">
                                        <button className="flex w-full items-center text-red-600 font-bold cursor-pointer">
                                            <LogOut className="mr-2 h-4 w-4" /> Log out
                                        </button>
                                    </form>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" asChild className="hidden md:inline-flex font-bold">
                                <Link href="/login">Login</Link>
                            </Button>
                        </div>
                    )}

                    {/* Mobile Menu */}
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[75vw] sm:w-[300px] bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-l border-slate-200/50 dark:border-slate-800/50 shadow-2xl p-0 flex flex-col">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30">
                                <SheetTitle className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400">
                                    Navigation Menu
                                </SheetTitle>
                                <SheetDescription className="sr-only">
                                    Main navigation links for the IEEE SMC KARE website.
                                </SheetDescription>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">IEEE SMC KARE</p>
                            </div>

                            <nav className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                                {navLinks.map((link) => {
                                    const Icon = link.icon;
                                    const isActive = pathname === link.href;
                                    return (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            onClick={() => setIsOpen(false)}
                                            className={cn(
                                                "flex items-center text-sm sm:text-base font-bold px-4 py-3 rounded-xl transition-all duration-200 group",
                                                isActive
                                                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                                                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                                            )}
                                        >
                                            <Icon className={cn(
                                                "w-5 h-5 mr-3 transition-transform duration-200 group-hover:scale-110",
                                                isActive ? "text-white" : "text-blue-500 dark:text-blue-400"
                                            )} />
                                            {link.label}
                                            <ChevronRight className={cn(
                                                "ml-auto w-4 h-4 transition-transform duration-200 group-hover:translate-x-1",
                                                isActive ? "text-white" : "text-slate-400 opacity-50"
                                            )} />
                                        </Link>
                                    );
                                })}

                                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
                                    <Link
                                        onClick={() => setIsOpen(false)}
                                        href="/status"
                                        className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-bold border border-blue-200/50 dark:border-blue-800/50 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all text-sm sm:text-base"
                                    >
                                        <Search className="w-4 h-4" />
                                        Status Checker
                                    </Link>
                                    {!profile && (
                                        <Link
                                            onClick={() => setIsOpen(false)}
                                            href="/login"
                                            className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold hover:shadow-lg hover:shadow-slate-900/20 dark:hover:shadow-white/20 transition-all text-sm sm:text-base"
                                        >
                                            <LogOut className="w-4 h-4 rotate-180" />
                                            Login
                                        </Link>
                                    )}
                                </div>
                            </nav>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    )
}
