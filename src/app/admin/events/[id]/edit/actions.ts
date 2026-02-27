'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createApprovalRequest } from '@/lib/actions/approvals'
import { logAction } from '@/lib/actions/audit'

export async function updateEvent(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const allowedRoles = ['admin', 'super_admin', 'event_admin']
    if (!profile || !allowedRoles.includes(profile.role)) {
        return { error: 'Insufficient permissions to edit events.' }
    }

    const eventId = formData.get('eventId') as string

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const eventType = formData.get('eventType') as string || 'General'
    const date = formData.get('date') as string
    const endDate = formData.get('endDate') as string
    const location = formData.get('location') as string
    const maxCapacity = formData.get('maxCapacity') ? parseInt(formData.get('maxCapacity') as string) : null
    const requiresApproval = formData.get('requiresApproval') === 'on'

    const registrationStart = formData.get('registrationStart') ? formData.get('registrationStart') as string : null
    const registrationEnd = formData.get('registrationEnd') ? formData.get('registrationEnd') as string : null
    const paymentDeadline = formData.get('paymentDeadline') ? formData.get('paymentDeadline') as string : null
    const fees = formData.get('fees') ? parseFloat(formData.get('fees') as string) : 0.00

    // Social Links
    const whatsappLink = formData.get('whatsappLink') as string || null
    const instagramLink = formData.get('instagramLink') as string || null

    const isFeePerPerson = formData.get('isFeePerPerson') === 'on'
    const isTeamEvent = formData.get('isTeamEvent') === 'on'
    const minTeamSize = formData.get('minTeamSize') ? parseInt(formData.get('minTeamSize') as string) : 1
    const maxTeamSize = formData.get('maxTeamSize') ? parseInt(formData.get('maxTeamSize') as string) : 1

    const paymentQr = formData.get('paymentQr') as File | null
    let paymentQrUrl = formData.get('existingPaymentQr') as string | null

    // If there is no existing QR URL and they didn't upload a new one, this is invalid
    if (!paymentQrUrl && (!paymentQr || paymentQr.size === 0)) {
        return { error: 'A Payment QR Code is required. Please upload one.' }
    }

    if (paymentQr && paymentQr.size > 0) {
        try {
            const arrayBuffer = await paymentQr.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const base64Data = buffer.toString('base64');

            const scriptUrl = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL;
            if (!scriptUrl) {
                console.error("Missing NEXT_PUBLIC_GOOGLE_SCRIPT_URL environment variable.");
                return { error: 'Server configuration error: Google Script URL is missing.' };
            }

            const uploadPayload = {
                base64Data: base64Data,
                filename: paymentQr.name,
                mimeType: paymentQr.type,
                eventTitle: title, // Tell script which event this is for 
                targetFolder: 'QR Code' // Put it in the "QR Code" subfolder
            };

            const uploadResponse = await fetch(scriptUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify(uploadPayload)
            });

            const rawText = await uploadResponse.text();
            const uploadResult = JSON.parse(rawText);

            if (!uploadResult.success) {
                console.error("Google Script Upload Error:", uploadResult.error);
                return { error: 'Failed to upload QR code to Google Drive.' };
            }

            paymentQrUrl = uploadResult.url;
        } catch (error) {
            console.error("Failed to upload QR Code:", error);
            return { error: 'Server error while uploading QR code.' };
        }
    }

    // New Banner Upload Logic
    const banner = formData.get('banner') as File | null
    let bannerUrl = formData.get('existingBanner') as string | null

    if (banner && banner.size > 0) {
        try {
            const arrayBuffer = await banner.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const base64Data = buffer.toString('base64');

            const scriptUrl = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL;
            if (scriptUrl) {
                const uploadPayload = {
                    base64Data: base64Data,
                    filename: banner.name,
                    mimeType: banner.type,
                    eventTitle: title,
                    targetFolder: 'Banner' // Put it in the "Banner" subfolder
                };

                const uploadResponse = await fetch(scriptUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain' },
                    body: JSON.stringify(uploadPayload)
                });

                const rawText = await uploadResponse.text();
                const uploadResult = JSON.parse(rawText);

                if (uploadResult.success) {
                    bannerUrl = uploadResult.url;
                } else {
                    console.error("Google Script Banner Upload Error:", uploadResult.error);
                }
            }
        } catch (error) {
            console.error("Failed to upload Banner:", error);
        }
    }

    let disabledDefaultFields = []
    let formSchema = []
    let teamMemberSettings = {}
    let attendanceSessions = []
    try {
        disabledDefaultFields = JSON.parse((formData.get('disabledDefaultFields') as string) || '[]')
        formSchema = JSON.parse((formData.get('formSchema') as string) || '[]')
        teamMemberSettings = JSON.parse((formData.get('teamMemberSettings') as string) || '{}')
        attendanceSessions = JSON.parse((formData.get('attendanceSessions') as string) || '[]')
    } catch (e) { console.error('Error parsing JSON schemas from form', e) }

    const coordinatorsRaw = formData.get('coordinators') as string
    const coordinators = coordinatorsRaw ? JSON.parse(coordinatorsRaw) : []

    const eventData = {
        title,
        description,
        event_type: eventType,
        date: date || null,
        end_date: endDate || null,
        location,
        max_capacity: maxCapacity,
        requires_approval: requiresApproval,
        registration_start: registrationStart,
        registration_end: registrationEnd,
        payment_deadline: paymentDeadline,
        fees,
        is_fee_per_person: isFeePerPerson,
        coordinators,
        is_team_event: isTeamEvent,
        min_team_size: minTeamSize,
        max_team_size: maxTeamSize,
        disabled_default_fields: disabledDefaultFields,
        form_schema: formSchema,
        team_member_settings: teamMemberSettings,
        attendance_sessions: attendanceSessions,
        payment_qr_url: paymentQrUrl,
        banner_url: bannerUrl,
        whatsapp_link: whatsappLink,
        instagram_link: instagramLink,
        updated_at: new Date().toISOString()
    }

    if (profile?.role === 'super_admin' || profile?.role === 'admin') {
        const { error } = await supabase
            .from('events')
            .update(eventData)
            .eq('id', eventId)

        if (error) return { error: error.message }
        await logAction('UPDATE_EVENT', 'events', eventId, eventData)
        revalidatePath(`/admin/events/${eventId}`)
        redirect(`/admin/events/${eventId}`)
    } else {
        // Event Admin must request approval to update full metadata
        const result = await createApprovalRequest(
            'UPDATE_DATA',
            'events',
            eventId,
            eventData
        )

        if (result.error) return result
        await logAction('REQUEST_UPDATE_EVENT', 'events', eventId, { title })
        revalidatePath(`/admin/events/${eventId}`)
        redirect(`/admin/events/${eventId}`)
    }
}
