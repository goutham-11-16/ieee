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
import { Menu, User, LogOut, LayoutDashboard, Search, ArrowRight } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export default function SiteHeader({ profile }: { profile: any }) {
    const [isScrolled, setIsScrolled] = useState(false)
    const pathname = usePathname()

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const navLinks = [
        { href: '/', label: 'Home' },
        { href: '/events', label: 'Events' },
        { href: '/about', label: 'About' },
        { href: '/team', label: 'Team' },
        { href: '/contact', label: 'Contact' }
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
                                isScrolled ? "h-10 md:h-12" : "h-12 md:h-20 lg:h-24"
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
                                <Button variant="ghost" className="relative h-10 w-10 rounded-full border">
                                    <Avatar className="h-full w-full">
                                        <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || 'U')}`} />
                                        <AvatarFallback>U</AvatarFallback>
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
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right">
                            <nav className="flex flex-col gap-4 mt-8">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={cn(
                                            "text-lg font-bold p-2 rounded-lg transition-colors",
                                            pathname === link.href ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30" : "hover:bg-slate-50"
                                        )}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                                <Link href="/status" className="p-4 rounded-xl bg-blue-600 text-white font-bold text-center mt-4">Status Checker</Link>
                                {!profile && (
                                    <Link href="/login" className="text-center font-bold mt-4">Login</Link>
                                )}
                            </nav>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    )
}
