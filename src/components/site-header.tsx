import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getCurrentProfile } from '@/lib/auth'
import { signout } from '@/app/auth/actions'
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

export default async function SiteHeader() {
    const profile = await getCurrentProfile()

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-24 items-center justify-between px-4">
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

                <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                    <Link href="/" className="hover:text-primary transition-colors">Home</Link>
                    <Link href="/events" className="hover:text-primary transition-colors">Events</Link>
                    <Link href="/about" className="hover:text-primary transition-colors">About</Link>
                    <Link href="/team" className="hover:text-primary transition-colors">Team</Link>
                    <Link href="/contact" className="hover:text-primary transition-colors">Contact</Link>
                    <Link href="/status" className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 transition-colors ml-4">Status Checker</Link>
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
