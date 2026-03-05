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

                <nav className="hidden md:flex items-center gap-2 text-sm font-medium ml-8">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "px-4 py-2 rounded-full transition-all duration-300 relative group overflow-hidden",
                                    isActive
                                        ? "text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/50 dark:bg-blue-900/20"
                                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                                )}
                            >
                                <span className="relative z-10">{link.label}</span>
                                {!isActive && (
                                    <span className="absolute inset-0 rounded-full bg-slate-100 dark:bg-slate-800 opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all duration-300 z-0"></span>
                                )}
                            </Link>
                        )
                    })}
                </nav>

                <div className="flex flex-1 items-center justify-end gap-5">
                    <div className="hidden md:flex items-center">
                        <Link
                            href="/status"
                            className="group flex items-center gap-2 px-5 py-2.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 hover:border-blue-500/50 hover:shadow-sm hover:shadow-blue-500/10 transition-all duration-300"
                        >
                            <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                            <span>Check Status</span>
                        </Link>
                    </div>

                    {profile ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-10 w-10 rounded-full ring-2 ring-transparent hover:ring-blue-500/20 transition-all p-0 overflow-hidden shadow-sm">
                                    <Avatar className="h-full w-full">
                                        <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || 'U')}&background=0D8ABC&color=fff`} className="object-cover" />
                                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-medium">
                                            {profile.full_name?.charAt(0) || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-64" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal p-3 bg-slate-50/50 dark:bg-slate-900/50 rounded-t-md">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-semibold leading-none">{profile.full_name}</p>
                                        <p className="text-xs leading-none text-slate-500 mt-1">{profile.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="m-0" />
                                <div className="p-1">
                                    <DropdownMenuItem asChild className="rounded-md focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer py-2.5">
                                        <Link href="/profile"><User className="mr-2 h-4 w-4 text-slate-500" /> <span className="font-medium">Profile</span></Link>
                                    </DropdownMenuItem>
                                    {['admin', 'super_admin', 'event_admin', 'finance_admin', 'content_admin', 'moderator'].includes(profile.role) && (
                                        <DropdownMenuItem asChild className="rounded-md focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer py-2.5">
                                            <Link href="/admin"><LayoutDashboard className="mr-2 h-4 w-4 text-blue-500" /> <span className="font-medium text-slate-900 dark:text-slate-100">Admin Dashboard</span></Link>
                                        </DropdownMenuItem>
                                    )}
                                </div>
                                <DropdownMenuSeparator className="m-0" />
                                <div className="p-1">
                                    <DropdownMenuItem asChild className="rounded-md focus:bg-red-50 dark:focus:bg-red-950/30 cursor-pointer py-2.5">
                                        <form action={signout} className="w-full">
                                            <button className="flex w-full items-center text-red-600 dark:text-red-400 font-medium">
                                                <LogOut className="mr-2 h-4 w-4" /> Log out
                                            </button>
                                        </form>
                                    </DropdownMenuItem>
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <div className="flex items-center">
                            <Button asChild className="hidden md:inline-flex bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-full px-6 font-medium shadow-sm hover:shadow transition-all">
                                <Link href="/login">Sign In</Link>
                            </Button>
                        </div>
                    )}

                    {/* Mobile Menu */}
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[80vw] sm:w-[350px] bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border-l border-slate-200/50 dark:border-slate-800/50 shadow-2xl p-0 flex flex-col">
                            <div className="p-6 pb-2">
                                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                                <SheetDescription className="sr-only">Main navigation links</SheetDescription>
                                <img
                                    src="https://i.ibb.co/yFsM0hzC/Gemini-Generated-Image-lb3h34lb3h34lb3h.png"
                                    alt="Logo"
                                    className="h-12 w-auto object-contain rounded-md"
                                />
                            </div>

                            <nav className="flex-1 overflow-y-auto p-4 flex flex-col gap-1 mt-4">
                                {navLinks.map((link) => {
                                    const Icon = link.icon;
                                    const isActive = pathname === link.href;
                                    return (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            onClick={() => setIsOpen(false)}
                                            className={cn(
                                                "flex items-center text-base font-medium px-4 py-3.5 rounded-2xl transition-all duration-200 group",
                                                isActive
                                                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                                                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                                            )}
                                        >
                                            <Icon className={cn(
                                                "w-5 h-5 mr-3 transition-transform duration-200 group-hover:scale-110",
                                                isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"
                                            )} />
                                            {link.label}
                                        </Link>
                                    );
                                })}

                                <div className="mt-8 px-2 flex flex-col gap-3">
                                    <Link
                                        onClick={() => setIsOpen(false)}
                                        href="/status"
                                        className="flex items-center justify-center gap-2 w-full px-4 py-3.5 rounded-full border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-base"
                                    >
                                        <Search className="w-4 h-4 text-slate-400" />
                                        Check Status
                                    </Link>
                                    {!profile && (
                                        <Link
                                            onClick={() => setIsOpen(false)}
                                            href="/login"
                                            className="flex items-center justify-center gap-2 w-full px-4 py-3.5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-medium hover:opacity-90 transition-opacity text-base"
                                        >
                                            <LogOut className="w-4 h-4 mr-1 rotate-180" />
                                            Sign In
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
