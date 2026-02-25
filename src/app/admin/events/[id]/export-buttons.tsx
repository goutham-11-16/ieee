'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { DownloadIcon, Loader2, FileTextIcon, SheetIcon } from 'lucide-react'
import { exportParticipantsCSV, exportParticipantsPDF } from '@/app/admin/reports/actions'

export function ExportParticipantsButtons({ eventId }: { eventId: string }) {
    const [loadingCSV, setLoadingCSV] = useState(false)
    const [loadingPDF, setLoadingPDF] = useState(false)

    async function handleCSV() {
        setLoadingCSV(true)
        try {
            const result = await exportParticipantsCSV(eventId)
            if (result.error) {
                toast.error(result.error)
            } else if (result.data) {
                // Trigger Download
                const blob = new Blob([result.data], { type: 'text/csv' })
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = result.filename
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                toast.success('CSV Exported')
            }
        } catch (e) {
            toast.error('Export failed')
        } finally {
            setLoadingCSV(false)
        }
    }

    async function handlePDF() {
        setLoadingPDF(true)
        try {
            const result = await exportParticipantsPDF(eventId)
            if (result.error) {
                toast.error(result.error)
            } else if (result.data) {
                // Decode Base64 and Download
                const byteCharacters = atob(result.data)
                const byteNumbers = new Array(byteCharacters.length)
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i)
                }
                const byteArray = new Uint8Array(byteNumbers)
                const blob = new Blob([byteArray], { type: 'application/pdf' })

                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = result.filename
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                toast.success('PDF Exported')
            }
        } catch (e) {
            console.error(e)
            toast.error('Export failed')
        } finally {
            setLoadingPDF(false)
        }
    }

    return (
        <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCSV} disabled={loadingCSV || loadingPDF}>
                {loadingCSV ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SheetIcon className="mr-2 h-4 w-4" />}
                Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handlePDF} disabled={loadingCSV || loadingPDF}>
                {loadingPDF ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileTextIcon className="mr-2 h-4 w-4" />}
                Export PDF
            </Button>
        </div>
    )
}
