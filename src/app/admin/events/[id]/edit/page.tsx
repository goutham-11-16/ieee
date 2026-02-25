import { updateEvent } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { EventFormBuilder } from '../../new/form-builder'
import { AttendanceSessionsBuilder } from '../../new/attendance-sessions-builder'
import Link from 'next/link'
import { getCurrentProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { DeleteEventButton } from '../delete-button'

export default async function EditEventPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params
    const profile = await getCurrentProfile()
    const allowedRoles = ['admin', 'super_admin', 'event_admin']
    if (!profile || !allowedRoles.includes(profile.role)) {
        redirect('/')
    }

    const supabase = await createClient()
    const { data: event } = await supabase
        .from('events')
        .select('*')
        .eq('id', params.id)
        .single()

    if (!event) notFound()

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Edit Event: {event.title}</h1>
                {(profile.role === 'super_admin' || profile.role === 'admin') && (
                    <DeleteEventButton eventId={event.id} eventTitle={event.title} />
                )}
            </div>

            {profile.role === 'event_admin' && (
                <div className="p-4 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 rounded-md text-sm mb-6 border border-orange-200 dark:border-orange-800">
                    <strong>Note:</strong> As an Event Admin, any changes you make here will be submitted to the Super Admins for approval before they go live on the public site.
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Event Configuration</CardTitle>
                    <CardDescription>Update metadata, dates, and dynamic form configurations.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={updateEvent as any} className="space-y-6">
                        <input type="hidden" name="eventId" value={event.id} />

                        <div className="space-y-2">
                            <Label htmlFor="title">Event Title</Label>
                            <Input id="title" name="title" required defaultValue={event.title} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="eventType">Event Type</Label>
                                <select
                                    id="eventType"
                                    name="eventType"
                                    defaultValue={event.event_type}
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="General">General</option>
                                    <option value="Workshop">Workshop</option>
                                    <option value="Seminar">Seminar</option>
                                    <option value="Competition">Competition</option>
                                    <option value="Hackathon">Hackathon</option>
                                    <option value="Webinar">Webinar</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="fees">Registration Fee (₹)</Label>
                                <Input id="fees" name="fees" type="number" min="0" step="0.01" defaultValue={event.fees} />
                                <Label className="flex items-center gap-2 text-xs font-normal cursor-pointer mt-1 text-muted-foreground">
                                    <input type="checkbox" name="isFeePerPerson" defaultChecked={event.is_fee_per_person} className="rounded border-gray-300" />
                                    Multiply fee per team member (if Team Event)
                                </Label>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" name="description" defaultValue={event.description || ''} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="date">Event Start Slot</Label>
                                <Input id="date" name="date" type="datetime-local" required defaultValue={event.date ? new Date(event.date).toISOString().slice(0, 16) : ''} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endDate">Event Ending Slot</Label>
                                <Input id="endDate" name="endDate" type="datetime-local" required defaultValue={event.end_date ? new Date(event.end_date).toISOString().slice(0, 16) : ''} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="registrationStart">Registration Open</Label>
                                <Input id="registrationStart" name="registrationStart" type="datetime-local" defaultValue={event.registration_start ? new Date(event.registration_start).toISOString().slice(0, 16) : ''} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="registrationEnd">Registration Close</Label>
                                <Input id="registrationEnd" name="registrationEnd" type="datetime-local" defaultValue={event.registration_end ? new Date(event.registration_end).toISOString().slice(0, 16) : ''} />
                            </div>
                        </div>

                        <input type="hidden" name="existingPaymentQr" value={event.payment_qr_url || ''} />
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="paymentDeadline">Payment Deadline (Optional)</Label>
                                <Input id="paymentDeadline" name="paymentDeadline" type="datetime-local" defaultValue={event.payment_deadline ? new Date(event.payment_deadline).toISOString().slice(0, 16) : ''} />
                                <p className="text-xs text-muted-foreground">After this date, unpaid registrations will be expired.</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="paymentQr">Payment QR Code {event.payment_qr_url && '(Uploaded)'}</Label>
                                <Input id="paymentQr" name="paymentQr" type="file" accept="image/*" />
                                <p className="text-xs text-muted-foreground">Upload a new QR code to replace the existing one.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="location">Location</Label>
                                <Input id="location" name="location" defaultValue={event.location || ''} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="maxCapacity">Max Capacity (Optional)</Label>
                                <Input id="maxCapacity" name="maxCapacity" type="number" defaultValue={event.max_capacity || ''} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="coordinators">Coordinators (JSON)</Label>
                            <Textarea
                                id="coordinators"
                                name="coordinators"
                                defaultValue={JSON.stringify(event.coordinators || [])}
                                className="font-mono text-xs"
                            />
                            <p className="text-xs text-muted-foreground">Enter as JSON array for now. UI builder coming soon.</p>
                        </div>

                        <AttendanceSessionsBuilder initialSessions={event.attendance_sessions || []} />

                        <EventFormBuilder
                            initialIsTeamEvent={event.is_team_event}
                            initialDisabledFields={event.disabled_default_fields || []}
                            initialCustomFields={event.form_schema || []}
                            initialTeamMemberSettings={event.team_member_settings || {
                                requireEmail: true,
                                requirePhone: false,
                                requireInstitution: false,
                                requireRegNo: false,
                                askCustomFields: false
                            }}
                        />

                        <div className="flex flex-col gap-2 p-4 border rounded-lg bg-slate-50 dark:bg-slate-900 mt-6">
                            <div className="flex items-center space-x-2">
                                <input type="checkbox" id="requiresApproval" name="requiresApproval" defaultChecked={event.requires_approval} className="h-4 w-4 rounded border-gray-300" />
                                <Label htmlFor="requiresApproval">Requires Admin Approval for Registrants</Label>
                            </div>
                        </div>

                        <div className="flex gap-4 justify-end items-center border-t pt-4">
                            <Button variant="ghost" asChild>
                                <Link href={`/admin/events/${event.id}`}>Cancel</Link>
                            </Button>

                            <Button type="submit">
                                {profile.role === 'event_admin' ? 'Request Update Approval' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
