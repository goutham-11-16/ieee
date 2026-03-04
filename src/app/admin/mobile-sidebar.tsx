'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils'

export function MobileAdminSidebar({ profile }: { profile: any }) {
    const [isOpen, setIsOpen] = useState(false)
    const pathname = usePathname()

    // Automatically close the menu when the pathname changes
    useEffect(() => {
        setIsOpen(false)
    }, [pathname])

    return (
        <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">Admin Panel</h2>
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Toggle Admin Menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[85vw] sm:w-[350px] p-0 flex flex-col bg-slate-50 dark:bg-slate-950">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                        <SheetTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">Tools</SheetTitle>
                        <SheetDescription className="sr-only">
                            List of administrative tools and links.
                        </SheetDescription>
                    </div>
                    <div className="p-4 flex flex-col gap-1 flex-1 overflow-y-auto">
                        {['super_admin', 'admin', 'event_admin'].includes(profile.role) && (
                            <>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4 mb-2 px-3">Management</p>
                                <Button variant="ghost" asChild className="justify-start text-muted-foreground hover:bg-slate-200/50 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100">
                                    <Link onClick={() => setIsOpen(false)} href="/admin/events">Events</Link>
                                </Button>
                                <Button variant="ghost" asChild className="justify-start text-muted-foreground hover:bg-slate-200/50 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100">
                                    <Link onClick={() => setIsOpen(false)} href="/admin/registrations">Registrations</Link>
                                </Button>
                            </>
                        )}

                        {['super_admin', 'admin', 'finance_admin'].includes(profile.role) && (
                            <Button variant="ghost" asChild className="justify-start text-muted-foreground hover:bg-slate-200/50 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100 mt-1">
                                <Link onClick={() => setIsOpen(false)} href="/admin/payments">Payments</Link>
                            </Button>
                        )}

                        {['super_admin', 'admin'].includes(profile.role) && (
                            <Button variant="ghost" asChild className="justify-start text-muted-foreground hover:bg-slate-200/50 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100 mt-1">
                                <Link onClick={() => setIsOpen(false)} href="/admin/approvals">Approvals</Link>
                            </Button>
                        )}

                        {['super_admin'].includes(profile.role) && (
                            <>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-6 mb-2 px-3">Administration</p>
                                <Button variant="ghost" asChild className="justify-start text-muted-foreground hover:bg-slate-200/50 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100">
                                    <Link onClick={() => setIsOpen(false)} href="/admin/team">Manage Team</Link>
                                </Button>
                            </>
                        )}

                        {(['super_admin', 'admin', 'content_admin', 'event_admin'].includes(profile.role)) && (
                            <>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-6 mb-2 px-3">Tools</p>
                                <Button variant="ghost" asChild className="justify-start text-muted-foreground hover:bg-slate-200/50 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100">
                                    <Link onClick={() => setIsOpen(false)} href="/admin/reports">Reports</Link>
                                </Button>
                            </>
                        )}

                        {['super_admin', 'admin', 'content_admin', 'event_admin'].includes(profile.role) && (
                            <>
                                <Button variant="ghost" asChild className="justify-start text-muted-foreground hover:bg-slate-200/50 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100 mt-1">
                                    <Link onClick={() => setIsOpen(false)} href="/admin/certificates">Certificates</Link>
                                </Button>
                                <Button variant="ghost" asChild className="justify-start text-amber-600 dark:text-amber-500 hover:bg-slate-200/50 dark:hover:bg-slate-800 mt-1">
                                    <Link onClick={() => setIsOpen(false)} href="/admin/certificates/exceptions">Exceptions</Link>
                                </Button>
                            </>
                        )}

                        {['super_admin', 'admin', 'event_admin'].includes(profile.role) && (
                            <Button variant="ghost" asChild className="justify-start text-muted-foreground hover:bg-slate-200/50 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100 mt-1">
                                <Link onClick={() => setIsOpen(false)} href="/admin/scan">QR Scanner</Link>
                            </Button>
                        )}

                        <div className="pt-4 mt-auto border-t border-slate-200 dark:border-slate-800">
                            <Button variant="ghost" asChild className="w-full justify-start text-muted-foreground hover:bg-slate-200/50 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100">
                                <Link onClick={() => setIsOpen(false)} href="/">Back to Site</Link>
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    )
}
