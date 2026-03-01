'use client'

import { useState, useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { verifyTicket, ScanResult, markSessionsPresent } from './actions'
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
import { CheckCircleIcon, XCircleIcon, RefreshCwIcon, CameraIcon, StopCircleIcon } from 'lucide-react'

export default function ScannerPage() {
    const [events, setEvents] = useState<any[]>([])
    const [selectedEventId, setSelectedEventId] = useState<string>('')
    const [selectedSessionName, setSelectedSessionName] = useState<string>('Default Focus Session')
    const [scanResult, setScanResult] = useState<ScanResult | null>(null)
    const [isScanning, setIsScanning] = useState(false)
    const [cameraProcessing, setCameraProcessing] = useState(false)

    // Reference to hold the actual scanner instance
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null)

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

        return () => {
            // Clean up the scanner safely when unmounting
            if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
                html5QrCodeRef.current.stop().catch(console.error)
            }
        }
    }, [])

    // Stop scanning if the user changes the event
    useEffect(() => {
        if (isScanning) {
            stopCamera()
        }
    }, [selectedEventId, selectedSessionName])

    const startCamera = async () => {
        if (!selectedEventId) {
            toast.error("Please select an event first.")
            return
        }

        setCameraProcessing(true)
        // Set scanning to true immediately so React mounts the DOM element
        setIsScanning(true)

        // Wait a tiny bit (100ms) for React to finish painting the DOM
        setTimeout(async () => {
            try {
                // Request permissions implicitly by asking for devices
                const cameras = await Html5Qrcode.getCameras()

                if (cameras && cameras.length > 0) {
                    // Initialize the direct API. "reader" must exist in the DOM now.
                    const html5QrCode = new Html5Qrcode("reader")
                    html5QrCodeRef.current = html5QrCode

                    await html5QrCode.start(
                        { facingMode: "environment" },
                        { fps: 10, qrbox: { width: 250, height: 250 } },
                        async (decodedText) => {
                            // 1. Pause immediately to prevent spamming
                            html5QrCode.pause()

                            try {
                                const result = await verifyTicket(decodedText, selectedEventId, selectedSessionName)
                                setScanResult(result)
                            } catch (e) {
                                setScanResult({ success: false, message: 'Processing Error', errorType: 'INVALID' })
                            }
                        },
                        (errorMessage) => {
                            // Ignore routine frame read errors
                        }
                    )
                } else {
                    toast.error("No cameras detected on this device.")
                    setIsScanning(false)
                }
            } catch (err) {
                console.error("Camera error: ", err)
                toast.error("Camera permission denied. Please allow camera access in your browser site settings.")
                setIsScanning(false)
            } finally {
                setCameraProcessing(false)
            }
        }, 100)
    }

    const stopCamera = async () => {
        setCameraProcessing(true)
        try {
            if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
                await html5QrCodeRef.current.stop()
                html5QrCodeRef.current.clear()
            }
            setIsScanning(false)
        } catch (err) {
            console.error("Failed to stop scanner", err)
        } finally {
            setCameraProcessing(false)
        }
    }

    const resetScan = () => {
        setScanResult(null)
        // Resume scanning
        if (html5QrCodeRef.current) {
            // html5-qrcode's pause/resume API isn't always reliable across versions, 
            // but resume() works safely if paused.
            try {
                html5QrCodeRef.current.resume()
            } catch (e) {
                console.error("Could not resume", e)
            }
        }
    }

    return (
        <div className="container mx-auto py-6 px-4 max-w-md flex flex-col items-center">
            <h1 className="text-2xl font-bold mb-6 text-center">Ticket Scanner</h1>

            <div className="w-full mb-6 space-y-4">
                <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select Event to Scan" />
                    </SelectTrigger>
                    <SelectContent>
                        {events.map(ev => (
                            <SelectItem key={ev.id} value={ev.id}>
                                {ev.title} ({new Date(ev.date).toLocaleDateString('en-GB')})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {selectedEvent?.attendance_sessions && selectedEvent.attendance_sessions.length > 0 && (
                    <Select value={selectedSessionName} onValueChange={setSelectedSessionName}>
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
                )}
            </div>

            {!selectedEventId && (
                <div className="text-center text-muted-foreground w-full py-10 bg-slate-50 dark:bg-slate-900 rounded-lg border border-dashed">
                    Select an event above to enable the scanner.
                </div>
            )}

            {selectedEventId && !isScanning && !scanResult && (
                <div className="w-full flex flex-col items-center py-10 bg-slate-50 dark:bg-slate-900 rounded-lg border border-dashed space-y-4 shadow-inner">
                    <p className="text-muted-foreground text-center px-4">Ready to scan tickets. Click below to request camera permissions and start scanning.</p>
                    <Button onClick={startCamera} size="lg" disabled={cameraProcessing} className="w-full max-w-xs gap-2 text-lg">
                        <CameraIcon className="w-5 h-5" /> {cameraProcessing ? 'Opening...' : 'Open Camera'}
                    </Button>
                </div>
            )}

            {isScanning && (
                <div className="w-full space-y-4 flex flex-col items-center">
                    <div className="flex justify-between items-center w-full px-2">
                        <span className="text-sm font-medium text-blue-600 animate-pulse flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-600"></span> Camera Active
                        </span>
                        <Button variant="outline" size="sm" onClick={stopCamera} disabled={cameraProcessing} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                            <StopCircleIcon className="w-4 h-4 mr-1" /> Stop
                        </Button>
                    </div>

                    <div id="reader" className="w-full max-w-sm rounded overflow-hidden shadow-lg border-2 border-primary bg-black"></div>
                    <p className="text-xs text-center text-muted-foreground">Align the QR code within the frame</p>
                </div>
            )}

            {scanResult && (
                <div className="w-full pt-4">
                    <Card className={`border-2 ${scanResult.success ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-red-500 bg-red-50 dark:bg-red-900/20'}`}>
                        <CardHeader className="text-center pb-2">
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
                                <div className="space-y-3">
                                    <div className="text-xl font-bold p-3 bg-white dark:bg-black/40 rounded shadow-sm border border-black/5 dark:border-white/10 flex flex-col items-center">
                                        <span className="text-[10px] uppercase text-muted-foreground mb-1 tracking-widest">Primary Attendee</span>
                                        {scanResult.attendeeName}
                                    </div>

                                    {scanResult.teamMembers && scanResult.teamMembers.length > 0 && (
                                        <div className="pt-2">
                                            <p className="text-[10px] uppercase text-muted-foreground mb-2 tracking-widest">Team Members</p>
                                            <div className="flex flex-wrap justify-center gap-2">
                                                {scanResult.teamMembers.map((member: any, i: number) => (
                                                    <div key={i} className="text-sm px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 font-medium">
                                                        {member.guestName}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {scanResult.success && scanResult.missedSessions && scanResult.missedSessions.length > 0 && (
                                <div className="mt-4 p-4 border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700 rounded-md text-left">
                                    <p className="font-semibold text-yellow-800 dark:text-yellow-300 text-sm mb-2">
                                        This user missed previous sessions:
                                    </p>
                                    <ul className="list-disc pl-5 text-sm text-yellow-800 dark:text-yellow-300 mb-3">
                                        {scanResult.missedSessions.map(sess => (
                                            <li key={sess}>{sess}</li>
                                        ))}
                                    </ul>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full border-yellow-400 text-yellow-700 bg-white hover:bg-yellow-100 dark:bg-black dark:text-yellow-300 dark:border-yellow-600 dark:hover:bg-yellow-900/50"
                                        onClick={async () => {
                                            if (!scanResult.registrationId || !selectedEventId) return;
                                            try {
                                                const res = await markSessionsPresent(scanResult.registrationId, selectedEventId, scanResult.missedSessions!);
                                                if (res.success) {
                                                    toast.success("Past sessions marked as present!");
                                                    // Remove the prompt
                                                    setScanResult({ ...scanResult, missedSessions: [] });
                                                } else {
                                                    toast.error(res.error || "Failed to mark past sessions");
                                                }
                                            } catch (e) {
                                                toast.error("An error occurred");
                                            }
                                        }}
                                    >
                                        Mark Past Sessions as Present
                                    </Button>
                                </div>
                            )}

                            <div className="flex flex-col gap-2 pt-4">
                                <Button size="lg" onClick={resetScan} className="w-full">
                                    <RefreshCwIcon className="mr-2 w-4 h-4" /> Scan Next
                                </Button>
                                <Button variant="outline" onClick={() => { setScanResult(null); stopCamera(); }} className="w-full text-muted-foreground">
                                    Close Scanner
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
