'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { resolveAction } from './actions'
import { toast } from 'sonner'
import { Loader2, Wand2Icon, XCircleIcon } from 'lucide-react'

export function ForceGenerateButton({ exceptionId, registrationId }: { exceptionId: string, registrationId: string }) {
    const [loading, setLoading] = useState<'generate' | 'reject' | null>(null)

    const handleAction = async (action: 'generate' | 'reject') => {
        if (!confirm(`Are you sure you want to ${action} for this exception?`)) return

        setLoading(action)
        try {
            const res = await resolveAction(exceptionId, registrationId, action)
            if (res.success) {
                toast.success(`Participant successfully ${action === 'generate' ? 'generated' : 'rejected'}!`)
            } else {
                toast.error(res.error)
            }
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setLoading(null)
        }
    }

    return (
        <div className="flex justify-end gap-2">
            <Button
                variant="outline"
                size="sm"
                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                onClick={() => handleAction('generate')}
                disabled={loading !== null}
            >
                {loading === 'generate' ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Wand2Icon className="w-4 h-4 mr-1" />}
                Force Generate
            </Button>

            <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={() => handleAction('reject')}
                disabled={loading !== null}
            >
                {loading === 'reject' ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <XCircleIcon className="w-4 h-4 mr-1" />}
                Reject
            </Button>
        </div>
    )
}
