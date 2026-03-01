'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SearchIcon, RefreshCcw, Loader2, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface PendingPayment {
    id: string
    amount: number
    created_at: string
    registration: {
        guest_name: string
        user: { full_name: string; email: string } | { full_name: string; email: string }[] | null
        event: { title: string } | { title: string }[] | null
    }
}

export default function PendingPaymentsList({ initialPayments }: { initialPayments: PendingPayment[] }) {
    const [searchQuery, setSearchQuery] = useState('')
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const handleRefresh = () => {
        setIsRefreshing(true)
        startTransition(() => {
            router.refresh()
            // We use a small timeout to ensure the loading state is visible and the refresh has time to complete
            setTimeout(() => setIsRefreshing(false), 800)
        })
    }

    const filteredPayments = initialPayments.filter((p) => {
        const reg = p.registration as any
        const evt = Array.isArray(reg?.event) ? reg.event[0] : reg?.event
        const profile = Array.isArray(reg?.user) ? reg.user[0] : reg?.user
        const name = (reg?.guest_name || profile?.full_name || '').toLowerCase()
        const eventTitle = (evt?.title || '').toLowerCase()
        const query = searchQuery.toLowerCase()

        return name.includes(query) || eventTitle.includes(query)
    })

    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-xl">Needs Verification</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            Review and approve payments uploaded by users.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1 md:w-64">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Filter by name or event..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 bg-white dark:bg-slate-950"
                            />
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleRefresh}
                            disabled={isRefreshing || isPending}
                            title="Refresh list"
                        >
                            <RefreshCcw className={`w-4 h-4 ${(isRefreshing || isPending) ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-0 pt-4">
                {filteredPayments.length > 0 ? (
                    <div className="overflow-x-auto border rounded-xl bg-white dark:bg-slate-950">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground uppercase bg-slate-50/50 dark:bg-slate-900/50 border-b">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Date</th>
                                    <th className="px-6 py-4 font-semibold">Registrant</th>
                                    <th className="px-6 py-4 font-semibold">Event</th>
                                    <th className="px-6 py-4 font-semibold text-right">Amount</th>
                                    <th className="px-6 py-4 font-semibold text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredPayments.map((p) => {
                                    const reg = p.registration as any
                                    const evt = Array.isArray(reg?.event) ? reg.event[0] : reg?.event
                                    const profile = Array.isArray(reg?.user) ? reg.user[0] : reg?.user

                                    return (
                                        <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                                                {new Date(p.created_at).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-slate-900 dark:text-slate-100">
                                                        {reg?.guest_name || profile?.full_name || 'Unknown User'}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {reg?.guest_email || profile?.email || 'No email'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="outline" className="font-normal border-slate-200">
                                                    {evt?.title || 'Unknown'}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right font-semibold">
                                                ₹{p.amount.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50" asChild>
                                                    <Link href={`/admin/payments/${p.id}`}>
                                                        Review <ExternalLink className="ml-2 w-3 h-3" />
                                                    </Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12 border-2 border-dashed rounded-xl bg-slate-50/50 dark:bg-slate-900/10">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                            <SearchIcon className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                            {searchQuery ? 'No matching payments' : 'All caught up!'}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                            {searchQuery
                                ? `We couldn't find any pending payments matching "${searchQuery}".`
                                : "There are currently no online payments waiting for verification."
                            }
                        </p>
                        {searchQuery && (
                            <Button variant="link" onClick={() => setSearchQuery('')} className="mt-2">
                                Clear search
                            </Button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
