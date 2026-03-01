'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { SearchIcon, Loader2, PhoneIcon, CalendarIcon } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { lookupByPhone } from './actions'

export default function StatusCheckerClient({ events }: { events: any[] }) {
    const [reference, setReference] = useState('')
    const [phone, setPhone] = useState('')
    const [eventId, setEventId] = useState('')
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')
    const router = useRouter()

    const handleRefSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!reference.trim()) return

        setLoading(true)
        setErrorMsg('')
        router.push(`/status/${reference.trim().toUpperCase()}`)
    }

    const handlePhoneSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!phone.trim() || !eventId) {
            setErrorMsg('Please select an event and enter your phone number.')
            return
        }

        setLoading(true)
        setErrorMsg('')

        try {
            const result = await lookupByPhone(eventId, phone.trim())
            if (result.error) {
                setErrorMsg(result.error)
                setLoading(false)
            } else if (result.referenceNumber) {
                router.push(`/status/${result.referenceNumber.toUpperCase()}`)
            }
        } catch (err) {
            setErrorMsg('An unexpected error occurred.')
            setLoading(false)
        }
    }

    return (
        <div className="container mx-auto py-24 flex items-center justify-center min-h-[70vh] px-4">
            <Card className="w-full max-w-md shadow-lg border-2">
                <CardHeader className="text-center space-y-2">
                    <CardTitle className="text-3xl font-bold">Status Checker</CardTitle>
                    <CardDescription className="text-base text-muted-foreground">
                        Check your registration status, upload payment proof, and download certificates.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="reference" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                            <TabsTrigger value="reference">Reference No.</TabsTrigger>
                            <TabsTrigger value="phone">Phone & Event</TabsTrigger>
                        </TabsList>

                        <TabsContent value="reference">
                            <form onSubmit={handleRefSubmit} className="space-y-6 mt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="reference" className="sr-only">Reference Number</Label>
                                    <div className="relative">
                                        <SearchIcon className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                                        <Input
                                            id="reference"
                                            type="text"
                                            placeholder="KARE-XXXXXXXX"
                                            className="pl-10 h-12 text-lg text-center uppercase tracking-widest font-mono"
                                            value={reference}
                                            onChange={(e) => setReference(e.target.value)}
                                            required
                                            maxLength={15}
                                        />
                                    </div>
                                    <p className="text-xs text-center text-muted-foreground mt-2">
                                        Enter your 8-character Registration Reference Number.
                                    </p>
                                </div>
                                <Button type="submit" className="w-full h-12 text-lg" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                                    Check Status
                                </Button>
                            </form>
                        </TabsContent>

                        <TabsContent value="phone">
                            <form onSubmit={handlePhoneSubmit} className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="eventSelect">Select Event</Label>
                                    <div className="relative">
                                        <CalendarIcon className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                                        <select
                                            id="eventSelect"
                                            className="w-full pl-10 h-12 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                            value={eventId}
                                            onChange={(e) => setEventId(e.target.value)}
                                            required
                                        >
                                            <option value="" disabled>Select the event...</option>
                                            {events.map((evt) => (
                                                <option key={evt.id} value={evt.id}>
                                                    {evt.title} ({new Date(evt.date).toLocaleDateString('en-GB')})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phoneNumber">Phone Number</Label>
                                    <div className="relative">
                                        <PhoneIcon className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                                        <Input
                                            id="phoneNumber"
                                            type="tel"
                                            placeholder="+1 234 567 8900"
                                            className="pl-10 h-12 text-lg"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground text-center mt-2">
                                        Enter the phone number used during registration.
                                    </p>
                                </div>

                                {errorMsg && (
                                    <div className="p-3 rounded-md bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 text-sm font-medium text-center">
                                        {errorMsg}
                                    </div>
                                )}

                                <Button type="submit" className="w-full h-12 text-lg mt-2" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                                    Find Registration
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}
