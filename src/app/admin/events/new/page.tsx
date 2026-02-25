import { createEvent } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EventFormBuilder } from './form-builder'
import { AttendanceSessionsBuilder } from './attendance-sessions-builder'
import Link from 'next/link'
import { getCurrentProfile } from '@/lib/auth'

export default async function CreateEventPage() {
    const profile = await getCurrentProfile()
    const canPublishDirectly = profile?.role === 'super_admin' || profile?.role === 'admin'

    return (
        <div className="max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Create New Event</CardTitle>
                </CardHeader>
                <CardContent>
                    <form action={createEvent as any} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="title">Event Title</Label>
                            <Input id="title" name="title" required placeholder="Annual Tech Conference" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="eventType">Event Type</Label>
                                <select
                                    id="eventType"
                                    name="eventType"
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
                                <Input id="fees" name="fees" type="number" min="0" step="0.01" defaultValue="0.00" />
                                <Label className="flex items-center gap-2 text-xs font-normal cursor-pointer mt-1 text-muted-foreground">
                                    <input type="checkbox" name="isFeePerPerson" className="rounded border-gray-300" />
                                    Multiply fee per team member (if Team Event)
                                </Label>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" name="description" placeholder="Event details..." />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="date">Event Start Slot</Label>
                                <Input id="date" name="date" type="datetime-local" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endDate">Event Ending Slot</Label>
                                <Input id="endDate" name="endDate" type="datetime-local" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="registrationStart">Registration Open</Label>
                                <Input id="registrationStart" name="registrationStart" type="datetime-local" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="registrationEnd">Registration Close</Label>
                                <Input id="registrationEnd" name="registrationEnd" type="datetime-local" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="paymentDeadline">Payment Deadline (Optional)</Label>
                                <Input id="paymentDeadline" name="paymentDeadline" type="datetime-local" />
                                <p className="text-xs text-muted-foreground">After this date, unpaid registrations will be expired.</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="paymentQr">Payment QR Code (Optional)</Label>
                                <Input id="paymentQr" name="paymentQr" type="file" accept="image/*" />
                                <p className="text-xs text-muted-foreground">Upload the QR code that applicants should scan to pay the fee.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="location">Location</Label>
                                <Input id="location" name="location" placeholder="Main Hall or Zoom" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="maxCapacity">Max Capacity (Optional)</Label>
                                <Input id="maxCapacity" name="maxCapacity" type="number" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="coordinators">Coordinators (JSON)</Label>
                            <Textarea
                                id="coordinators"
                                name="coordinators"
                                placeholder='[{"name": "Alice", "email": "alice@example.com"}]'
                                className="font-mono text-xs"
                            />
                            <p className="text-xs text-muted-foreground">Enter as JSON array for now. UI builder coming soon.</p>
                        </div>

                        <AttendanceSessionsBuilder />

                        <EventFormBuilder />

                        <div className="flex flex-col gap-2 p-4 border rounded-lg bg-slate-50 dark:bg-slate-900 mt-6">
                            <div className="flex items-center space-x-2">
                                <input type="checkbox" id="requiresApproval" name="requiresApproval" className="h-4 w-4 rounded border-gray-300" />
                                <Label htmlFor="requiresApproval">Requires Admin Approval for Registrants</Label>
                            </div>
                        </div>

                        <div className="flex gap-4 justify-end items-center border-t pt-4">
                            <Button variant="ghost" asChild>
                                <Link href="/admin/events">Cancel</Link>
                            </Button>

                            <div className="flex gap-2">
                                <Button type="submit" name="action" value="draft" variant="outline">
                                    Save as Draft
                                </Button>
                                <Button type="submit" name="action" value="submit">
                                    {canPublishDirectly ? 'Publish Event' : 'Submit for Approval'}
                                </Button>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
