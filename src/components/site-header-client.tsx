'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getCurrentProfile } from '@/lib/auth'
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
import { Menu, User, LogOut, LayoutDashboard } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

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

    return (
        <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${isScrolled ? 'border-b bg-background/90 backdrop-blur-md shadow-sm' : 'bg-transparent border-transparent'}`}>
            <div className="container flex h-24 items-center justify-between px-4 transition-all duration-300">
                <Link href="/" className="flex items-center gap-6">
                    <div className="flex items-center gap-4">
                        {/* Combined IEEE SMC & KARE Logo */}
                        <img
                            src="https://i.ibb.co/yFsM0hzC/Gemini-Generated-Image-lb3h34lb3h34lb3h.png"
                            alt="IEEE SMC KARE Logo"
                            className="h-12 md:h-20 lg:h-24 w-auto object-contain rounded-md"
                        />
                    </div>
                </Link>

                <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
                    {[
                        { href: '/', label: 'Home' },
                        { href: '/events', label: 'Events' },
                        { href: '/about', label: 'About' },
                        { href: '/team', label: 'Team' },
                        { href: '/contact', label: 'Contact' }
                    ].map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`px-4 py-2 rounded-md transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800 ${pathname === link.href ? 'text-primary font-semibold bg-slate-50 dark:bg-slate-900/50' : 'text-slate-600 dark:text-slate-300'}`}
                        >
                            {link.label}
                        </Link>
                    ))}
                    <Link
                        href="/status"
                        className="ml-4 px-4 py-2 rounded-full border border-blue-200 bg-blue-50 text-blue-600 font-semibold hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
                    >
                        Status Checker
                    </Link>
                </nav>

                <div className="flex items-center gap-4">
                    {profile ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || 'U')}`} />
                                        <AvatarFallback>U</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{profile.full_name}</p>
                                        <p className="text-xs leading-none text-muted-foreground">{profile.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/profile"><User className="mr-2 h-4 w-4" /> Profile</Link>
                                </DropdownMenuItem>
                                {['admin', 'super_admin', 'event_admin', 'finance_admin', 'content_admin', 'moderator'].includes(profile.role) && (
                                    <DropdownMenuItem asChild>
                                        <Link href="/admin"><LayoutDashboard className="mr-2 h-4 w-4" /> Admin Dashboard</Link>
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <form action={signout} className="w-full">
                                        <button className="flex w-full items-center text-red-600">
                                            <LogOut className="mr-2 h-4 w-4" /> Log out
                                        </button>
                                    </form>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" asChild className="hidden md:inline-flex">
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
                                <Link href="/" className="text-lg font-medium">Home</Link>
                                <Link href="/events" className="text-lg font-medium">Events</Link>
                                <Link href="/about" className="text-lg font-medium">About</Link>
                                <Link href="/team" className="text-lg font-medium">Team</Link>
                                <Link href="/contact" className="text-lg font-medium">Contact</Link>
                                <Link href="/status" className="text-lg font-bold text-blue-600">Status Checker</Link>
                                {!profile && (
                                    <>
                                        <Link href="/login" className="text-lg font-medium">Login</Link>
                                    </>
                                )}
                            </nav>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    )
}
