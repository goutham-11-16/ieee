import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { approveRequest, rejectRequest } from '@/lib/actions/approvals'

export default async function ApprovalsDashboard() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return <div>Unauthorized</div>

    // Verify Super Admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'super_admin' && profile?.role !== 'admin') {
        return (
            <div className="container mx-auto py-10 text-center">
                <AlertCircle className="mx-auto h-10 w-10 text-red-500 mb-4" />
                <h1 className="text-2xl font-bold">Access Denied</h1>
                <p className="text-muted-foreground">You do not have permission to view this page.</p>
            </div>
        )
    }

    const { data: rawRequests, error } = await supabase
        .from('approval_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

    if (error) {
        console.error("APPROVALS FETCH ERROR:", error)
    }

    let requests = rawRequests || []
    if (requests.length > 0) {
        const requesterIds = Array.from(new Set(requests.map((r: any) => r.requester_id)))
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', requesterIds)

        requests = requests.map((req: any) => ({
            ...req,
            requester: profiles?.find(p => p.id === req.requester_id) || null
        }))
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Approval Requests</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Pending Actions</CardTitle>
                    <CardDescription>Review and approve critical system actions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Action</TableHead>
                                <TableHead>Requester</TableHead>
                                <TableHead>Entity</TableHead>
                                <TableHead>Details</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Decision</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requests?.map((req: any) => (
                                <TableRow key={req.id}>
                                    <TableCell>
                                        <Badge variant="outline" className="font-mono">
                                            {req.action_type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">{req.requester?.full_name}</div>
                                        <div className="text-xs text-muted-foreground">{req.requester?.email}</div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="capitalize">{req.entity_table}</span>
                                        <br />
                                        <span className="text-xs text-muted-foreground font-mono">{req.entity_id.slice(0, 8)}...</span>
                                    </TableCell>
                                    <TableCell>
                                        <pre className="text-xs bg-muted p-2 rounded max-w-[200px] overflow-auto">
                                            {JSON.stringify(req.new_data, null, 2)}
                                        </pre>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(req.created_at).toLocaleDateString('en-GB')}
                                    </TableCell>
                                    <TableCell className="flex gap-2">
                                        <form action={approveRequest.bind(null, req.id) as any}>
                                            <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                                <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                                            </Button>
                                        </form>
                                        <form action={rejectRequest.bind(null, req.id, 'Rejected by admin') as any}>
                                            <Button size="sm" variant="destructive">
                                                <XCircle className="w-4 h-4 mr-1" /> Reject
                                            </Button>
                                        </form>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {(!requests || requests.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No pending requests.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
