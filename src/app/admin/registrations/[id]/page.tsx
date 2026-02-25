import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeftIcon, CalendarIcon, UserIcon, UsersIcon } from 'lucide-react'

export default async function AdminRegistrationDetails(props: { params: Promise<{ id: string }> }) {
    const params = await props.params
    const supabase = await createClient()

    const { data: registration } = await supabase
        .from('registrations')
        .select(`
            *,
            user:profiles!user_id(full_name, email),
            event:events(id, title, date, form_schema),
            payments(id, status, receipt_url, amount, transaction_reference, created_at),
            attendance(id, check_in_time)
        `)
        .eq('id', params.id)
        .single()

    if (!registration) {
        notFound()
    }

    const reg = registration as any
    const participantName = reg.guest_name || reg.user?.full_name || 'Guest'
    const participantEmail = reg.guest_email || reg.user?.email || 'N/A'

    const payment = reg.payments && reg.payments.length > 0
        ? [...reg.payments].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
        : undefined;
    const attended = reg.attendance?.[0]

    return (
        <div className="container mx-auto py-8 px-4 max-w-4xl">
            <Button variant="ghost" asChild className="mb-6 -ml-4">
                <Link href="/admin/registrations">
                    <ArrowLeftIcon className="mr-2 h-4 w-4" /> Back to Registrations
                </Link>
            </Button>

            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Registration Details</h1>
                    <div className="text-muted-foreground flex items-center gap-2">
                        <UserIcon className="h-4 w-4" /> {participantName} ({participantEmail})
                    </div>
                    {reg.guest_phone && (
                        <div className="text-muted-foreground text-sm mt-1">Phone: {reg.guest_phone}</div>
                    )}
                    {reg.guest_institution && (
                        <div className="text-muted-foreground text-sm mt-1">Institution: {reg.guest_institution}</div>
                    )}
                    {reg.guest_reg_no && (
                        <div className="text-muted-foreground text-sm mt-1 font-mono">Reg No: {reg.guest_reg_no}</div>
                    )}
                </div>
                <div className="flex flex-col items-end gap-2">
                    <Badge variant={reg.status === 'approved' ? 'success' : 'secondary'} className="text-sm px-3 py-1">
                        {reg.status}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                        Ref: <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">{reg.reference_number || 'N/A'}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Event Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <span className="text-sm text-muted-foreground block mb-1">Event Name</span>
                            <Link href={`/admin/events/${reg.event?.id}`} className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                                {reg.event?.title}
                            </Link>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                            {new Date(reg.event?.date).toLocaleString()}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Financial & Attendance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-sm text-muted-foreground">Payment Status</span>
                            <Badge variant={payment?.status === 'verified' ? 'success' : payment?.status === 'pending_verification' ? 'warning' : 'secondary'}>
                                {payment?.status || 'unpaid'}
                            </Badge>
                        </div>
                        {payment?.transaction_reference && (
                            <div className="text-sm py-1 border-b">
                                <span className="text-muted-foreground">Ref:</span> {payment.transaction_reference}
                            </div>
                        )}
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-sm text-muted-foreground">Attendance</span>
                            <Badge variant={attended ? 'success' : 'outline'}>
                                {attended ? 'Checked In' : 'Absent'}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="mb-8">
                <CardHeader>
                    <CardTitle className="text-lg">Custom Form Responses</CardTitle>
                    <CardDescription>Extra details collected during registration</CardDescription>
                </CardHeader>
                <CardContent>
                    {!reg.custom_responses || Object.keys(reg.custom_responses).length === 0 ? (
                        <p className="text-muted-foreground text-sm italic">No custom responses provided.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {Object.entries(reg.custom_responses).map(([key, value]) => {
                                const schemaField = reg.event?.form_schema?.find((f: any) => f.id === key)
                                const label = schemaField ? schemaField.label : key
                                return (
                                    <div key={key} className="bg-slate-50 dark:bg-slate-900 border p-4 rounded-lg">
                                        <span className="text-sm text-muted-foreground block mb-1">{label}</span>
                                        <span className="font-medium">{String(value)}</span>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {reg.team_members && reg.team_members.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <UsersIcon className="h-5 w-5" /> Team Roster
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 p-4 rounded-lg flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center font-bold text-blue-700 dark:text-blue-300">L</div>
                                    <div>
                                        <p className="font-medium">{participantName} <Badge variant="outline" className="ml-2 h-5">Leader</Badge></p>
                                        <p className="text-sm text-muted-foreground">{participantEmail}</p>
                                    </div>
                                </div>
                            </div>

                            {reg.team_members.map((member: any, idx: number) => (
                                <div key={idx} className="bg-slate-50 dark:bg-slate-900 border p-4 rounded-lg relative">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-400">{idx + 2}</div>
                                        <div>
                                            <p className="font-medium">{member.guestName}</p>
                                            <p className="text-sm text-muted-foreground">{member.guestEmail}</p>
                                            {member.guestPhone && <p className="text-xs text-muted-foreground mt-0.5">{member.guestPhone}</p>}
                                        </div>
                                    </div>

                                    {member.customResponses && Object.keys(member.customResponses).length > 0 && (
                                        <div className="mt-4 pt-4 border-t space-y-2">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase">Member Responses</p>
                                            <div className="grid grid-cols-2 gap-4">
                                                {Object.entries(member.customResponses).map(([key, value]) => {
                                                    const schemaField = reg.event?.form_schema?.find((f: any) => f.id === key)
                                                    const label = schemaField ? schemaField.label : key
                                                    return (
                                                        <div key={key}>
                                                            <span className="text-xs text-muted-foreground block">{label}</span>
                                                            <span className="text-sm font-medium">{String(value)}</span>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
