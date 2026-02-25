'use client'

import { Button } from '@/components/ui/button'
import { DownloadIcon } from 'lucide-react'

export default function PrintButton() {
    return (
        <Button variant="outline" size="sm" onClick={() => window.print()}>
            <DownloadIcon className="mr-2 h-4 w-4" /> Print / Save PDF
        </Button>
    )
}
