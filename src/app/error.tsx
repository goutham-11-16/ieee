'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircleIcon } from 'lucide-react'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error("Global Application Error Caught:", error)
    }, [error])

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
            <div className="max-w-xl w-full text-center space-y-6 bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800">
                <div className="flex justify-center mb-4">
                    <div className="h-16 w-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                        <AlertCircleIcon className="h-8 w-8" />
                    </div>
                </div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Server Configuration Error</h2>
                <p className="text-slate-500 dark:text-slate-400">
                    A critical server-side exception occurred. If this is a live deployment, please check your Vercel Environment Variables.
                </p>

                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 p-4 rounded-xl text-left overflow-hidden">
                    <div className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2 border-b border-red-200 dark:border-red-900/50 pb-2">Technical Details:</div>
                    <p className="text-sm font-mono text-red-700 dark:text-red-400 break-words whitespace-pre-wrap">
                        {error.message || 'Unknown render exception.'}
                    </p>
                    {error.digest && (
                        <p className="mt-3 text-xs text-red-600/70 dark:text-red-400/70">
                            Digest ID: {error.digest}
                        </p>
                    )}
                </div>

                <div className="pt-4">
                    <Button onClick={() => window.location.reload()} size="lg">
                        Reload Page
                    </Button>
                </div>
            </div>
        </div>
    )
}
