import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getCurrentProfile } from '@/lib/auth'
import { redirect } from 'next/navigation'

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
        <div className="flex min-h-screen flex-col md:flex-row">
            <aside className="w-full md:w-64 bg-slate-900 text-white p-6 md:min-h-screen">
                <h2 className="text-2xl font-bold mb-8">Admin Panel</h2>
                <nav className="flex flex-col gap-2">
                    {['super_admin', 'admin', 'event_admin'].includes(profile.role) && (
                        <>
                            <Button variant="ghost" asChild className="justify-start text-white hover:text-white hover:bg-slate-800">
                                <Link href="/admin/events">Events</Link>
                            </Button>
                            <Button variant="ghost" asChild className="justify-start text-white hover:text-white hover:bg-slate-800">
                                <Link href="/admin/registrations">Registrations</Link>
                            </Button>
                        </>
                    )}

                    {['super_admin', 'admin', 'finance_admin'].includes(profile.role) && (
                        <Button variant="ghost" asChild className="justify-start text-white hover:text-white hover:bg-slate-800">
                            <Link href="/admin/payments">Payments</Link>
                        </Button>
                    )}

                    {['super_admin', 'admin'].includes(profile.role) && (
                        <Button variant="ghost" asChild className="justify-start text-white hover:text-white hover:bg-slate-800">
                            <Link href="/admin/approvals">Approvals</Link>
                        </Button>
                    )}

                    {['super_admin'].includes(profile.role) && (
                        <Button variant="ghost" asChild className="justify-start text-white hover:text-white hover:bg-slate-800">
                            <Link href="/admin/team">Manage Team</Link>
                        </Button>
                    )}

                    <Button variant="ghost" asChild className="justify-start text-white hover:text-white hover:bg-slate-800">
                        <Link href="/admin/reports">Reports</Link>
                    </Button>

                    {['super_admin', 'admin', 'content_admin', 'event_admin'].includes(profile.role) && (
                        <>
                            <Button variant="ghost" asChild className="justify-start text-white hover:text-white hover:bg-slate-800">
                                <Link href="/admin/certificates">Certificates</Link>
                            </Button>
                            <Button variant="ghost" asChild className="justify-start text-amber-500 hover:text-amber-400 hover:bg-slate-800">
                                <Link href="/admin/certificates/exceptions">Exceptions</Link>
                            </Button>
                        </>
                    )}

                    {['super_admin', 'admin', 'event_admin'].includes(profile.role) && (
                        <Button variant="ghost" asChild className="justify-start text-white hover:text-white hover:bg-slate-800">
                            <Link href="/admin/scan">QR Scanner</Link>
                        </Button>
                    )}
                    <div className="pt-4 mt-auto border-t border-slate-700">
                        <Button variant="ghost" asChild className="justify-start text-gray-400 hover:text-white hover:bg-slate-800">
                            <Link href="/">Back to Site</Link>
                        </Button>
                    </div>
                </nav>
            </aside>
            <main className="flex-1 p-8 bg-gray-50 dark:bg-gray-900">
                {children}
            </main>
        </div>
    )
}
