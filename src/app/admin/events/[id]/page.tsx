import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeftIcon, CalendarIcon, MapPinIcon, UsersIcon, DollarSignIcon, EditIcon, QrCodeIcon, AwardIcon } from 'lucide-react'
import { ExportParticipantsButtons } from './export-buttons'
import { DeleteEventButton } from './delete-button'

export default async function AdminEventDashboard(props: { params: Promise<{ id: string }> }) {
    const params = await props.params
    const supabase = await createClient()

    // Fetch Event Stats
    const { data: event } = await supabase
        .from('events')
        .select('*')
        .eq('id', params.id)
        .single()

    if (!event) notFound()

    // Fetch Active Registrations (exclude cancelled/rejected/expired)
    const { data: activeRegs, count: registrationCount } = await supabase
        .from('registrations')
        .select('team_members, status, expires_at', { count: 'exact' })
        .eq('event_id', params.id)
        .in('status', ['approved', 'pending_approval', 'pending_payment'])

    const now = new Date()
    const validRegs = activeRegs?.filter(reg => {
        if (reg.status === 'pending_payment' && reg.expires_at) {
            return new Date(reg.expires_at) > now
        }
        return true
    }) || []

    const validCount = validRegs.length

    // Calculate total participants if needed
    const participantCount = validRegs.reduce((acc, reg) => {
        if (event.is_capacity_by_teams) return acc + 1
        const teamSize = Array.isArray(reg.team_members) ? reg.team_members.length : 0
        return acc + 1 + teamSize
    }, 0)

    const { count: attendedCount } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', params.id)

    // Revenue based on valid registrations
    const revenue = validCount * event.fees

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-6">
                <Button variant="ghost" className="mb-4" asChild>
                    <Link href="/admin/events">
                        <ArrowLeftIcon className="mr-2 w-4 h-4" /> Back to Events
                    </Link>
                </Button>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">{event.title}</h1>
                        <div className="flex items-center gap-4 text-muted-foreground mt-2">
                            <span className="flex items-center gap-1"><CalendarIcon className="w-4 h-4" /> {new Date(event.date).toLocaleDateString()}</span>
                            <span className="flex items-center gap-1"><MapPinIcon className="w-4 h-4" /> {event.location || 'Online'}</span>
                            <span className={`px-2 py-0.5 rounded text-xs ${event.is_published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {event.is_published ? 'Published' : 'Draft'}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
                        <Button variant="outline" asChild>
                            <Link href={`/admin/events/${event.id}/edit`}>
                                <EditIcon className="mr-2 w-4 h-4" /> Edit
                            </Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href={`/admin/scan`}>
                                <QrCodeIcon className="mr-2 w-4 h-4" /> Scan
                            </Link>
                        </Button>
                        <DeleteEventButton eventId={event.id} eventTitle={event.title} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Active Regs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{validCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Participants</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{participantCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Checked In</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{attendedCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Est. Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{revenue.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Capacity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{event.max_capacity || '∞'}</div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="participants" className="w-full">
                <TabsList>
                    <TabsTrigger value="participants">Participants</TabsTrigger>
                    <TabsTrigger value="certificates">Certificates</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="participants" className="space-y-4 pt-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Participant List</h3>
                        <ExportParticipantsButtons eventId={event.id} />
                    </div>
                    <Card>
                        <CardContent className="p-0">
                            {/* We could reuse a data table here, but for now referencing the export functionality primarily */}
                            <div className="p-8 text-center text-muted-foreground">
                                <UsersIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>Manage participants and view detailed list in the main registrations view.</p>
                                <Button variant="link" asChild>
                                    <Link href="/admin/registrations">Go to All Registrations</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="certificates" className="space-y-4 pt-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Certificates</h3>
                    </div>
                    <Card>
                        <CardContent className="p-6 flex flex-col items-center justify-center space-y-4">
                            <AwardIcon className="w-12 h-12 opacity-50" />
                            <p className="text-center text-muted-foreground max-w-md">
                                Design and issue certificates for attendees. Templates must be locked before generation.
                            </p>
                            <Button asChild>
                                <Link href={`/admin/events/${event.id}/certificates`}>
                                    Manage Certificates
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="settings" className="pt-4">
                    <p className="text-muted-foreground">Event settings and advanced configuration.</p>
                </TabsContent>
            </Tabs>
        </div>
    )
}
