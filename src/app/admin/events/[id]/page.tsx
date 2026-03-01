import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeftIcon, CalendarIcon, MapPinIcon, UsersIcon, DollarSignIcon, EditIcon, QrCodeIcon, AwardIcon } from 'lucide-react'
import { ExportParticipantsButtons } from './export-buttons'
import { DeleteEventButton } from './delete-button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

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

    // Fetch Registrations and categorize
    const { data: registrations } = await supabase
        .from('registrations')
        .select('id, team_members, status, expires_at, guest_name, guest_email, guest_phone, user:profiles!user_id(full_name, email)')
        .eq('event_id', params.id)

    const now = new Date()

    // Confirmed = Approved
    const confirmedRegs = registrations?.filter(r => r.status === 'approved') || []

    // Pending = pending_approval OR (pending_payment NOT expired) -- though pending_payment with proof is usually pending_approval
    // Let's stick to status strictly for clarity unless we check payments
    const pendingRegs = registrations?.filter(r => r.status === 'pending_approval') || []

    // Failed/Expired = rejected, cancelled, expired, or (pending_payment AND expired)
    const failedRegs = registrations?.filter(r => {
        if (['rejected', 'cancelled', 'expired'].includes(r.status)) return true
        if (r.status === 'pending_payment' && r.expires_at && new Date(r.expires_at) < now) return true
        return false
    }) || []

    const confirmedCount = confirmedRegs.length
    const pendingCount = pendingRegs.length
    const failedCount = failedRegs.length

    // Active = Confirmed + Pending
    const activeCount = confirmedCount + pendingCount

    // Participant Count (Strictly from Confirmed)
    const participantCount = confirmedRegs.reduce((acc, reg) => {
        if (event.is_capacity_by_teams) return acc + 1
        const teamSize = Array.isArray(reg.team_members) ? reg.team_members.length : 0
        return acc + 1 + teamSize
    }, 0)

    const { count: attendedCount } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', params.id)

    // Revenue based strictly on Confirmed/Approved
    const revenue = confirmedCount * event.fees

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
                        <CardTitle className="text-sm font-medium text-muted-foreground">Confirmed Regs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{confirmedCount}</div>
                        {pendingCount > 0 && <p className="text-xs text-amber-600">+{pendingCount} pending verification</p>}
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
                        <CardTitle className="text-sm font-medium text-muted-foreground">Actual Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{revenue.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Approved only</p>
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
                    <TabsTrigger value="participants">Participants ({confirmedCount})</TabsTrigger>
                    <TabsTrigger value="failed">Failed/Expired ({failedCount})</TabsTrigger>
                    <TabsTrigger value="certificates">Certificates</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="participants" className="space-y-4 pt-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Confirmed Participants</h3>
                        <ExportParticipantsButtons eventId={event.id} />
                    </div>
                    <Card>
                        <CardContent className="p-0 overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Contact</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {confirmedRegs.map((r: any) => (
                                        <TableRow key={r.id}>
                                            <TableCell className="font-medium">
                                                {r.guest_name || r.user?.full_name}
                                                <div className="text-xs text-muted-foreground font-mono">{r.id.slice(0, 8)}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">{r.guest_email || r.user?.email}</div>
                                                <div className="text-xs text-muted-foreground">{r.guest_phone || 'N/A'}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">Confirmed</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/admin/registrations/${r.id}`}>View</Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {confirmedRegs.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                                No confirmed participants yet.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="failed" className="space-y-4 pt-4">
                    <div className="flex flex-col">
                        <h3 className="text-lg font-semibold">Failed or Expired Registrations</h3>
                        <p className="text-sm text-muted-foreground">These records are excluded from the main participant list and revenue.</p>
                    </div>
                    <Card>
                        <CardContent className="p-0 overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Reason</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {failedRegs.map((r: any) => (
                                        <TableRow key={r.id} className="opacity-70 grayscale-[0.5]">
                                            <TableCell className="font-medium">
                                                {r.guest_name || r.user?.full_name}
                                                <div className="text-xs text-muted-foreground">{r.guest_email || r.user?.email}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="destructive">{r.status}</Badge>
                                            </TableCell>
                                            <TableCell className="max-w-[200px] truncate text-xs">
                                                {r.status === 'expired' ? 'Payment timeout' : 'Rejected or Cancelled'}
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/admin/registrations/${r.id}`}>Details</Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {failedRegs.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                                No failed records found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
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
