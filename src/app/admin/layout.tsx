import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getCurrentProfile } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { MobileAdminSidebar } from './mobile-sidebar'

function AdminNav({ profile }: { profile: any }) {
    return (
        <nav className="flex flex-col gap-1 flex-1">
            {['super_admin', 'admin', 'event_admin'].includes(profile.role) && (
                <>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4 mb-2 px-3">Management</p>
                    <Button variant="ghost" asChild className="justify-start text-muted-foreground hover:bg-slate-200/50 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100">
                        <Link href="/admin/events">Events</Link>
                    </Button>
                    <Button variant="ghost" asChild className="justify-start text-muted-foreground hover:bg-slate-200/50 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100">
                        <Link href="/admin/registrations">Registrations</Link>
                    </Button>
                </>
            )}

            {['super_admin', 'admin', 'finance_admin'].includes(profile.role) && (
                <Button variant="ghost" asChild className="justify-start text-muted-foreground hover:bg-slate-200/50 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100 mt-1">
                    <Link href="/admin/payments">Payments</Link>
                </Button>
            )}

            {['super_admin', 'admin'].includes(profile.role) && (
                <Button variant="ghost" asChild className="justify-start text-muted-foreground hover:bg-slate-200/50 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100 mt-1">
                    <Link href="/admin/approvals">Approvals</Link>
                </Button>
            )}

            {['super_admin'].includes(profile.role) && (
                <>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-6 mb-2 px-3">Administration</p>
                    <Button variant="ghost" asChild className="justify-start text-muted-foreground hover:bg-slate-200/50 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100">
                        <Link href="/admin/team">Manage Team</Link>
                    </Button>
                </>
            )}

            {(['super_admin', 'admin', 'content_admin', 'event_admin'].includes(profile.role)) && (
                <>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-6 mb-2 px-3">Tools</p>
                    <Button variant="ghost" asChild className="justify-start text-muted-foreground hover:bg-slate-200/50 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100">
                        <Link href="/admin/reports">Reports</Link>
                    </Button>
                </>
            )}

            {['super_admin', 'admin', 'content_admin', 'event_admin'].includes(profile.role) && (
                <>
                    <Button variant="ghost" asChild className="justify-start text-muted-foreground hover:bg-slate-200/50 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100 mt-1">
                        <Link href="/admin/certificates">Certificates</Link>
                    </Button>
                    <Button variant="ghost" asChild className="justify-start text-amber-600 dark:text-amber-500 hover:bg-slate-200/50 dark:hover:bg-slate-800 mt-1">
                        <Link href="/admin/certificates/exceptions">Exceptions</Link>
                    </Button>
                </>
            )}

            {['super_admin', 'admin', 'event_admin'].includes(profile.role) && (
                <Button variant="ghost" asChild className="justify-start text-muted-foreground hover:bg-slate-200/50 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100 mt-1">
                    <Link href="/admin/scan">QR Scanner</Link>
                </Button>
            )}

            <div className="pt-4 mt-auto border-t border-slate-200 dark:border-slate-800">
                <Button variant="ghost" asChild className="w-full justify-start text-muted-foreground hover:bg-slate-200/50 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100">
                    <Link href="/">Back to Site</Link>
                </Button>
            </div>
        </nav>
    )
}

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const profile = await getCurrentProfile()

    const allowedRoles = ['admin', 'super_admin', 'event_admin', 'finance_admin', 'content_admin', 'moderator']
    if (!profile?.role || !allowedRoles.includes(profile.role)) {
        redirect('/')
    }

    return (
        <div className="flex min-h-screen flex-col md:flex-row bg-background">
            {/* Mobile Header with Drawer */}
            <MobileAdminSidebar profile={profile} />

            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-64 bg-slate-50/50 dark:bg-slate-900/40 border-r border-slate-200 dark:border-slate-800 p-6 min-h-screen flex-col">
                <h2 className="text-xl font-bold tracking-tight mb-8 text-slate-900 dark:text-zinc-100">Admin Panel</h2>
                <AdminNav profile={profile} />
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0 p-4 md:p-8 md:px-12 bg-white dark:bg-slate-950">
                {children}
            </main>
        </div>
    )
}
