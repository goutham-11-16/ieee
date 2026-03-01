import { getCurrentProfile } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ActivityIcon, CalendarIcon, UsersIcon, CheckCircleIcon } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function AdminDashboardOverview() {
    const profile = await getCurrentProfile()

    if (!profile) {
        redirect('/')
    }

    const supabase = await createClient()

    // Fetch top-level stats
    const { count: eventsCount } = await supabase.from('events').select('*', { count: 'exact', head: true })
    const { count: regsCount } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .in('status', ['approved', 'pending_approval', 'pending_payment'])

    // Fetch recent registrations
    const { data: recentRegs } = await supabase
        .from('registrations')
        .select(`
            id,
            status,
            created_at,
            event:events(title)
        `)
        .order('created_at', { ascending: false })
        .limit(5)

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">Overview</h1>
                <p className="text-muted-foreground mt-2">Welcome back to the Admin Panel.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="shadow-sm border-slate-200/60 dark:border-slate-800/60">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Events</CardTitle>
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{eventsCount || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">Active and past events</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-slate-200/60 dark:border-slate-800/60">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Registrations</CardTitle>
                        <UsersIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{regsCount || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">Across all events</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-slate-200/60 dark:border-slate-800/60">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">System Status</CardTitle>
                        <ActivityIcon className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">All Good</div>
                        <p className="text-xs text-muted-foreground mt-1">Services operating normally</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="col-span-1 shadow-sm border-slate-200/60 dark:border-slate-800/60">
                    <CardHeader>
                        <CardTitle className="text-lg">Recent Registration Activity</CardTitle>
                        <CardDescription>The latest attendees to sign up.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentRegs?.map((reg: any) => (
                                <div key={reg.id} className="flex items-center justify-between border-b border-border/50 pb-4 last:border-0 last:pb-0">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">{reg.event?.title || 'Unknown Event'}</p>
                                        <p className="text-xs text-muted-foreground">{new Date(reg.created_at).toLocaleDateString('en-GB')}</p>
                                    </div>
                                    <Badge variant="outline" className="font-normal capitalize">{reg.status.replace('_', ' ')}</Badge>
                                </div>
                            ))}
                        </div>
                        <Button variant="ghost" className="w-full mt-4 text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800" asChild>
                            <Link href="/admin/registrations">View All Registrations</Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card className="col-span-1 border-dashed shadow-none bg-slate-50/50 dark:bg-slate-900/20">
                    <CardContent className="flex flex-col items-center justify-center p-6 h-full min-h-[300px] text-center">
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-full shadow-sm mb-4 border border-slate-200/60 dark:border-slate-700">
                            <CheckCircleIcon className="h-8 w-8 text-blue-500" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">You're caught up!</h3>
                        <p className="text-sm text-muted-foreground max-w-[250px] mx-auto">
                            Check the specific management tabs on the left for detailed administration tools.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
