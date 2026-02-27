'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { EventFormBuilder } from '../../new/form-builder'
import { AttendanceSessionsBuilder } from '../../new/attendance-sessions-builder'
import Link from 'next/link'
import { compressImage } from '@/lib/image-compression'
import { updateEvent } from './actions'

export function EditEventForm({ event, profileRole }: { event: any, profileRole: string }) {
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const formData = new FormData(e.currentTarget)

            // Compress Banner if provided
            const bannerFile = formData.get('banner') as File
            if (bannerFile && bannerFile.size > 0) {
                const compressedBanner = await compressImage(bannerFile, { maxSizeMB: 0.1, maxWidthOrHeight: 1200 })
                formData.set('banner', compressedBanner)
            }

            // Compress QR Code if provided
            const qrFile = formData.get('paymentQr') as File
            if (qrFile && qrFile.size > 0) {
                const compressedQr = await compressImage(qrFile, { maxSizeMB: 0.1, maxWidthOrHeight: 800 })
                formData.set('paymentQr', compressedQr)
            }

            // Call Server Action
            await updateEvent(formData)
        } catch (error) {
            console.error("Error updating event:", error)
            alert("Failed to update event. Please check the console for details.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
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

            <input type="hidden" name="existingBanner" value={event.banner_url || ''} />
            <div className="space-y-2">
                <Label htmlFor="banner">Event Banner Image {event.banner_url && '(Uploaded)'}</Label>
                <Input id="banner" name="banner" type="file" accept="image/*" required={!event.banner_url} />
                <p className="text-xs text-muted-foreground">{event.banner_url ? 'Upload a new banner to replace the existing one.' : 'Upload a banner image to be displayed at the top of the event page.'}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="whatsappLink">WhatsApp Group Link (Optional)</Label>
                    <Input id="whatsappLink" name="whatsappLink" type="url" defaultValue={event.whatsapp_link || ''} placeholder="https://chat.whatsapp.com/..." />
                    <p className="text-xs text-muted-foreground">Shown to users after successful registration.</p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="instagramLink">Instagram Link (Optional)</Label>
                    <Input id="instagramLink" name="instagramLink" type="url" defaultValue={event.instagram_link || ''} placeholder="https://instagram.com/..." />
                </div>
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
                    <Input id="paymentQr" name="paymentQr" type="file" accept="image/*" required={!event.payment_qr_url} />
                    <p className="text-xs text-muted-foreground">{event.payment_qr_url ? 'Upload a new QR code to replace the existing one.' : 'Upload the QR code that applicants should scan to pay the fee.'}</p>
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
                <Button variant="ghost" asChild disabled={isSubmitting}>
                    <Link href={`/admin/events/${event.id}`}>Cancel</Link>
                </Button>

                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : (profileRole === 'event_admin' ? 'Request Update Approval' : 'Save Changes')}
                </Button>
            </div>
        </form>
    )
}
