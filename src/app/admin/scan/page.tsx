'use client'

import { useState, useEffect, useRef } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { verifyTicket, ScanResult } from './actions'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, CheckCircleIcon, XCircleIcon, RefreshCwIcon } from 'lucide-react'

export default function ScannerPage() {
    const [events, setEvents] = useState<any[]>([])
    const [selectedEventId, setSelectedEventId] = useState<string>('')
    const [selectedSessionName, setSelectedSessionName] = useState<string>('Default Focus Session')
    const [scanResult, setScanResult] = useState<ScanResult | null>(null)
    const [isScanning, setIsScanning] = useState(false)
    const scannerRef = useRef<Html5QrcodeScanner | null>(null)

    const selectedEvent = events.find(e => e.id === selectedEventId)

    // Load events for selection
    useEffect(() => {
        const fetchEvents = async () => {
            const supabase = createClient()
            const { data } = await supabase
                .from('events')
                .select('id, title, date, attendance_sessions')
                .order('date', { ascending: false })

            if (data) setEvents(data)
        }
        fetchEvents()
    }, [])

    useEffect(() => {
        if (selectedEventId && !isScanning && !scanResult) {
            startScanner()
        }
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err))
            }
        }
    }, [selectedEventId, isScanning, scanResult])

    const startScanner = () => {
        // Find the element
        const element = document.getElementById('reader')
        if (!element) return

        if (scannerRef.current) {
            scannerRef.current.clear().catch(() => { })
        }

        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            false
        )

        scanner.render(onScanSuccess, onScanFailure)
        scannerRef.current = scanner
        setIsScanning(true)
    }

    const onScanSuccess = async (decodedText: string) => {
        if (!selectedEventId) return

        // Pause scanning to process
        if (scannerRef.current) {
            scannerRef.current.pause()
        }

        try {
            const result = await verifyTicket(decodedText, selectedEventId, selectedSessionName)
            setScanResult(result)

            if (result.success) {
                // Audio feedback could go here
            }
        } catch (e) {
            setScanResult({ success: false, message: 'Processing Error', errorType: 'INVALID' })
        }
    }

    const onScanFailure = (error: any) => {
        // Common, ignore
    }

    const resetScan = () => {
        setScanResult(null)
        if (scannerRef.current) {
            scannerRef.current.resume()
        }
    }

    return (
        <div className="container mx-auto py-6 px-4 max-w-md">
            <h1 className="text-2xl font-bold mb-6 text-center">Ticket Scanner</h1>

            <div className="mb-6">
                <Select value={selectedEventId} onValueChange={(val) => { setSelectedEventId(val); setScanResult(null); }}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select Event to Scan" />
                    </SelectTrigger>
                    <SelectContent>
                        {events.map(ev => (
                            <SelectItem key={ev.id} value={ev.id}>
                                {ev.title} ({new Date(ev.date).toLocaleDateString()})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {selectedEvent?.attendance_sessions && selectedEvent.attendance_sessions.length > 0 && (
                <div className="mb-6">
                    <Select value={selectedSessionName} onValueChange={(val) => { setSelectedSessionName(val); setScanResult(null); }}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Session (e.g., Morning)" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Default Focus Session">Default Focus Session</SelectItem>
                            {selectedEvent.attendance_sessions.map((sess: any) => (
                                <SelectItem key={sess.id} value={sess.name}>
                                    {sess.name} ({sess.startTime} - {sess.endTime})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {!selectedEventId && (
                <div className="text-center text-muted-foreground py-10">
                    Please select an event to start scanning.
                </div>
            )}

            {selectedEventId && !scanResult && (
                <div className="space-y-4">
                    <div id="reader" className="w-full"></div>
                    <p className="text-xs text-center text-muted-foreground">Point functionality using camera</p>
                </div>
            )}

            {scanResult && (
                <Card className={`border-2 ${scanResult.success ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-red-500 bg-red-50 dark:bg-red-900/20'}`}>
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-2">
                            {scanResult.success ?
                                <CheckCircleIcon className="w-16 h-16 text-green-600 dark:text-green-400" /> :
                                <XCircleIcon className="w-16 h-16 text-red-600 dark:text-red-400" />
                            }
                        </div>
                        <CardTitle className={`text-2xl ${scanResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                            {scanResult.success ? 'Valid Ticket' : scanResult.errorType === 'DUPLICATE' ? 'Already Used' : 'Invalid Ticket'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <div className="text-lg font-medium">
                            {scanResult.message}
                        </div>
                        {scanResult.attendeeName && (
                            <div className="text-xl font-bold p-2 bg-white dark:bg-black/20 rounded">
                                {scanResult.attendeeName}
                            </div>
                        )}

                        <Button size="lg" onClick={resetScan} className="w-full mt-4">
                            <RefreshCwIcon className="mr-2 w-4 h-4" /> Scan Next
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
