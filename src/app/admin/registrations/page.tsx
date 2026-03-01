import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { DownloadIcon } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { formatDateTimeIST } from '@/lib/utils'

export default async function AdminRegistrationsPage() {
    const supabase = await createClient()
    const { data: allRegistrations } = await supabase
        .from('registrations')
        .select(`
      id,
      guest_name,
      guest_email,
      guest_reg_no,
      status,
      created_at,
      expires_at,
      user:profiles!user_id(full_name, email),
      event:events(title),
      payments(status, created_at)
    `)
        .order('created_at', { ascending: false })

    const now = new Date()

    // Categorize
    const activeRegs = allRegistrations?.filter(r =>
        ['approved', 'pending_approval', 'pending_payment'].includes(r.status) &&
        !(r.status === 'pending_payment' && r.expires_at && new Date(r.expires_at) < now)
    ) || []

    const failedRegs = allRegistrations?.filter(r =>
        ['rejected', 'cancelled', 'expired'].includes(r.status) ||
        (r.status === 'pending_payment' && r.expires_at && new Date(r.expires_at) < now)
    ) || []

    const renderTable = (regs: any[]) => (
        <div className="rounded-md border bg-white overflow-auto">
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
                    {regs.map((reg: any) => {
                        const latestPayment = reg.payments && reg.payments.length > 0
                            ? [...reg.payments].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
                            : null;
                        const paymentStatus = latestPayment?.status
                        let statusVariant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" = "default"

                        if (reg.status === 'approved') statusVariant = 'success'
                        else if (reg.status === 'pending_approval') statusVariant = 'warning'
                        else if (reg.status === 'rejected' || reg.status === 'cancelled') statusVariant = 'destructive'
                        else if (reg.status === 'expired') statusVariant = 'outline'
                        else if (reg.status === 'pending_payment') statusVariant = 'secondary'

                        const isExpired = reg.status === 'pending_payment' && reg.expires_at && new Date(reg.expires_at) < now

                        return (
                            <TableRow key={reg.id} className={isExpired || ['rejected', 'cancelled', 'expired'].includes(reg.status) ? "opacity-70" : ""}>
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
                                        <Badge variant={isExpired ? 'outline' : statusVariant}>
                                            {isExpired ? 'Expired' : (reg.status === 'pending_approval' ? 'Pending' : reg.status)}
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
                    {regs.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                No registrations found in this category.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )

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

            <Tabs defaultValue="active" className="w-full">
                <TabsList>
                    <TabsTrigger value="active">Active ({activeRegs.length})</TabsTrigger>
                    <TabsTrigger value="failed">Failed / Expired ({failedRegs.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="active" className="pt-4">
                    {renderTable(activeRegs)}
                </TabsContent>
                <TabsContent value="failed" className="pt-4">
                    {renderTable(failedRegs)}
                </TabsContent>
            </Tabs>
        </div>
    )
}
