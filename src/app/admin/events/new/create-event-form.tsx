'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { EventFormBuilder } from './form-builder'
import { AttendanceSessionsBuilder } from './attendance-sessions-builder'
import Link from 'next/link'
import { compressImage } from '@/lib/image-compression'
import { createEvent } from '../actions'

export function CreateEventForm({ canPublishDirectly }: { canPublishDirectly: boolean }) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitAction, setSubmitAction] = useState<'draft' | 'submit'>('submit')
    const [loadingText, setLoadingText] = useState('')

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (isSubmitting) return // Prevent double submission
        setIsSubmitting(true)
        setLoadingText('Preparing data...')

        try {
            const formData = new FormData(e.currentTarget)

            // Explicitly append the tracked action to ensure the server knows whether to publish or draft
            formData.append('action', submitAction)

            // Compress Banner
            const bannerFile = formData.get('banner') as File
            if (bannerFile && bannerFile.size > 0) {
                setLoadingText('Compressing Banner Image...')
                const compressedBanner = await compressImage(bannerFile, { maxSizeMB: 0.1, maxWidthOrHeight: 1200 })
                formData.set('banner', compressedBanner)
            }

            // Compress QR Code
            const qrFile = formData.get('paymentQr') as File
            if (qrFile && qrFile.size > 0) {
                setLoadingText('Compressing QR Code...')
                const compressedQr = await compressImage(qrFile, { maxSizeMB: 0.1, maxWidthOrHeight: 800 })
                formData.set('paymentQr', compressedQr)
            }

            // Call Server Action
            setLoadingText('Uploading to Database & Drive...')
            await createEvent(formData)
        } catch (error) {
            console.error("Error submitting form:", error)
            alert("Failed to submit event. Please check the console for details.")
        } finally {
            setIsSubmitting(false)
            setLoadingText('')
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
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

            <div className="space-y-2">
                <Label htmlFor="banner">Event Banner Image</Label>
                <Input id="banner" name="banner" type="file" accept="image/*" required />
                <p className="text-xs text-muted-foreground">Upload a banner image to be displayed at the top of the event page.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="whatsappLink">WhatsApp Group Link (Optional)</Label>
                    <Input id="whatsappLink" name="whatsappLink" type="url" placeholder="https://chat.whatsapp.com/..." />
                    <p className="text-xs text-muted-foreground">Shown to users after successful registration.</p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="instagramLink">Instagram Link (Optional)</Label>
                    <Input id="instagramLink" name="instagramLink" type="url" placeholder="https://instagram.com/..." />
                </div>
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
                    <Label htmlFor="paymentQr">Payment QR Code</Label>
                    <Input id="paymentQr" name="paymentQr" type="file" accept="image/*" required />
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
                    <Label className="flex items-center gap-2 text-xs font-normal cursor-pointer mt-1 text-muted-foreground">
                        <input type="checkbox" name="isCapacityByTeams" className="rounded border-gray-300" />
                        Count capacity by Number of Teams (if Team Event)
                    </Label>
                </div>
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
                <Button variant="ghost" asChild disabled={isSubmitting}>
                    <Link href="/admin/events">Cancel</Link>
                </Button>

                <div className="flex gap-2">
                    <Button type="submit" onClick={() => setSubmitAction('draft')} variant="outline" disabled={isSubmitting}>
                        {isSubmitting && submitAction === 'draft' ? (loadingText || 'Saving...') : 'Save as Draft'}
                    </Button>
                    <Button type="submit" onClick={() => setSubmitAction('submit')} disabled={isSubmitting}>
                        {isSubmitting && submitAction === 'submit' ? (loadingText || 'Submitting...') : (canPublishDirectly ? 'Publish Event' : 'Submit for Approval')}
                    </Button>
                </div>
            </div>
        </form>
    )
}
