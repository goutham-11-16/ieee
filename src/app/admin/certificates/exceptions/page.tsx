import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertTriangleIcon, CheckCircle2Icon, SearchXIcon } from 'lucide-react'
import { ForceGenerateButton } from './force-generate-button'
import { resolveAction } from './actions'

export default async function ExceptionsPage() {
    const supabase = await createClient()

    // Fetch unresolved exceptions
    const { data: exceptions } = await supabase
        .from('certificate_exceptions')
        .select(`
            id,
            job_id,
            registration_id,
            participant_name,
            reason,
            status,
            created_at,
            event:events(title)
        `)
        .eq('status', 'pending_review')
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <AlertTriangleIcon className="w-8 h-8 text-amber-500" />
                        Action Required: Certificate Exceptions
                    </h1>
                    <p className="text-muted-foreground">Review participants who were skipped during mass certificate generation.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Pending Reviews</CardTitle>
                    <CardDescription>
                        These participants either did not pay or did not have their attendance physically marked. Super Admins can override this and force-generate their certificate, or permanently reject them.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {exceptions && exceptions.length > 0 ? (
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Participant</TableHead>
                                        <TableHead>Event</TableHead>
                                        <TableHead>Exception Reason</TableHead>
                                        <TableHead>Date Logged</TableHead>
                                        <TableHead className="text-right">Admin Override</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {exceptions.map((exc: any) => (
                                        <TableRow key={exc.id}>
                                            <TableCell className="font-medium">{exc.participant_name}</TableCell>
                                            <TableCell>{exc.event?.title}</TableCell>
                                            <TableCell>
                                                <Badge variant="destructive" className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-300">
                                                    {exc.reason}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {new Date(exc.created_at).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <ForceGenerateButton exceptionId={exc.id} registrationId={exc.registration_id} />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                            <CheckCircle2Icon className="w-12 h-12 text-emerald-500 mb-4 opacity-50" />
                            <p className="text-lg font-medium text-slate-900 dark:text-slate-100">All clear!</p>
                            <p>No pending certificate exceptions found.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
