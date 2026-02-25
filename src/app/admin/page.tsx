import { getCurrentProfile } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AdminRoute() {
    const profile = await getCurrentProfile()

    if (!profile) {
        redirect('/')
    }

    if (['super_admin', 'admin', 'event_admin'].includes(profile.role)) {
        redirect('/admin/events')
    } else if (profile.role === 'finance_admin') {
        redirect('/admin/payments')
    } else {
        // Since content_admin and moderator don't have dedicated portal pages yet, fallback to reports
        redirect('/admin/reports')
    }
}
