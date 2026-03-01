import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { DownloadIcon } from 'lucide-react'
import Link from 'next/link'
import { formatDateTimeIST } from '@/lib/utils'

export default async function AdminRegistrationsPage() {
    const supabase = await createClient()
    const { data: registrations } = await supabase
        .from('registrations')
        .select(`
      id,
      guest_reg_no,
      status,
      created_at,
      user:profiles!user_id(full_name, email),
      event:events(title),
      payments(status, created_at)
    `)
        .neq('status', 'pending_payment')

    // Client-side sort for complex logic "Unpaid Last"
    // Priority: 
    // 1. Action Needed (Pending Approval / Pending Verification)
    // 2. Approved / Verified
    // 3. Rejected / Cancelled / Expired
    // 4. Unpaid (if we consider unpaid as 'lowest priority' or 'waiting for user')
    // Actually, user asked for "Unpaid registrations sorted last".

    const sortedRegistrations = registrations?.sort((a: any, b: any) => {
        const getScore = (reg: any) => {
            const latestPayment = reg.payments && reg.payments.length > 0
                ? [...reg.payments].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
                : null;
            const paymentStatus = latestPayment?.status || 'unpaid'
            // High score = Top of list
            if (reg.status === 'pending_approval' || paymentStatus === 'pending_verification') return 100 // Action needed
            if (reg.status === 'approved' || paymentStatus === 'verified') return 50 // Done/Good
            if (reg.status === 'rejected' || reg.status === 'cancelled') return 0 // History
            if (reg.status === 'expired') return -10
            if (paymentStatus === 'unpaid') return -20 // Bottom
            return 0
        }
        return getScore(b) - getScore(a)
    })

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Registrations</h1>
                <Button asChild variant="outline">
                    <a href="/api/export/registrations" download>
                        <DownloadIcon className="w-4 h-4 mr-2" /> Export CSV
                    </a>
                </Button>
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User / Reg No</TableHead>
                            <TableHead>Event</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedRegistrations?.map((reg: any) => {
                            const latestPayment = reg.payments && reg.payments.length > 0
                                ? [...reg.payments].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
                                : null;
                            const paymentStatus = latestPayment?.status
                            let statusVariant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" = "default"

                            if (reg.status === 'approved') statusVariant = 'success'
                            else if (reg.status === 'pending_approval') statusVariant = 'warning'
                            else if (reg.status === 'rejected' || reg.status === 'cancelled') statusVariant = 'destructive'
                            else if (reg.status === 'expired') statusVariant = 'outline'

                            return (
                                <TableRow key={reg.id}>
                                    <TableCell>
                                        <div className="font-medium">{reg.user?.full_name || reg.guest_name || 'Guest'}</div>
                                        <div className="text-xs text-muted-foreground">{reg.user?.email || reg.guest_email || ''}</div>
                                        {reg.guest_reg_no && (
                                            <div className="text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1 py-0.5 mt-1 inline-block rounded">
                                                {reg.guest_reg_no}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>{reg.event?.title}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1 items-start">
                                            <Badge variant={statusVariant}>
                                                {reg.status === 'pending_approval' ? 'Pending' : reg.status}
                                            </Badge>
                                            {paymentStatus && (
                                                <Badge variant={paymentStatus === 'verified' ? 'outline' : 'secondary'} className="text-[10px] h-5">
                                                    Payment: {paymentStatus}
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>{formatDateTimeIST(reg.created_at)}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/admin/registrations/${reg.id}`}>Manage</Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                        {(!registrations || registrations.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    No registrations found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
