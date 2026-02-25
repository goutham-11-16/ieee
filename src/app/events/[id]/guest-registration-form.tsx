'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { registerGuest } from './actions'
import { toast } from 'sonner'
import { Loader2, TicketCheckIcon, PrinterIcon, UsersIcon, PlusIcon, TrashIcon } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import Link from 'next/link'

export type CustomFieldSchema = {
    id: string;
    label: string;
    type: 'text' | 'number' | 'dropdown';
    required: boolean;
    options?: string[];
}

export default function GuestRegistrationForm({
    eventId,
    eventDate,
    registrationEnd,
    disabledFields = [],
    formSchema = [],
    isTeamEvent = false,
    minTeamSize = 1,
    maxTeamSize = 1,
    teamMemberSettings = {
        requireEmail: true,
        requirePhone: false,
        requireInstitution: false,
        requireRegNo: false,
        askCustomFields: false
    }
}: {
    eventId: string
    eventDate: string
    registrationEnd: string | null
    disabledFields?: string[]
    formSchema?: CustomFieldSchema[]
    isTeamEvent?: boolean
    minTeamSize?: number
    maxTeamSize?: number
    teamMemberSettings?: {
        requireEmail: boolean
        requirePhone: boolean
        requireInstitution: boolean
        requireRegNo: boolean
        askCustomFields: boolean
    }
}) {
    const [loading, setLoading] = useState(false)
    const [successRef, setSuccessRef] = useState<string | null>(null)

    // Custom responses for the Team Leader
    const [leaderCustomResponses, setLeaderCustomResponses] = useState<Record<string, string>>({})

    // Team Members Array
    const [teamMembers, setTeamMembers] = useState<any[]>([])

    const now = new Date()
    const isRegistrationClosed = registrationEnd ? new Date(registrationEnd) < now : new Date(eventDate) < now

    const handleLeaderCustomChange = (id: string, value: string) => {
        setLeaderCustomResponses(prev => ({ ...prev, [id]: value }))
    }

    const addTeamMember = () => {
        if (teamMembers.length + 1 >= maxTeamSize) return
        setTeamMembers([
            ...teamMembers,
            { id: Date.now().toString(), guestName: '', guestEmail: '', guestPhone: '', guestInstitution: '', customResponses: {} }
        ])
    }

    const removeTeamMember = (id: string) => {
        setTeamMembers(teamMembers.filter(m => m.id !== id))
    }

    const updateTeamMember = (id: string, field: string, value: string) => {
        setTeamMembers(teamMembers.map(m => m.id === id ? { ...m, [field]: value } : m))
    }

    const updateTeamMemberCustom = (memberId: string, fieldId: string, value: string) => {
        setTeamMembers(teamMembers.map(m => {
            if (m.id === memberId) {
                return { ...m, customResponses: { ...m.customResponses, [fieldId]: value } }
            }
            return m
        }))
    }

    const currentTotalSize = 1 + teamMembers.length // Leader + members

    async function onSubmit(formData: FormData) {
        if (isTeamEvent && currentTotalSize < minTeamSize) {
            toast.error(`This is a team event. You must have at least ${minTeamSize} members.`)
            return
        }

        setLoading(true)
        try {
            // Package the dynamic data as JSON strings to send nicely to the server action
            formData.append('customResponses', JSON.stringify(leaderCustomResponses))
            formData.append('teamMembers', JSON.stringify(teamMembers))

            const result = await registerGuest(formData)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Registration saved!')
                setSuccessRef(result.referenceNumber || null)
            }
        } catch (e) {
            toast.error('Failed to submit registration')
        } finally {
            setLoading(false)
        }
    }

    if (isRegistrationClosed) {
        return (
            <Button disabled variant="destructive">
                Registration Closed
            </Button>
        )
    }

    if (successRef) {
        return (
            <div className="flex flex-col items-center gap-4 p-4 border rounded-xl bg-green-50 dark:bg-green-950 border-green-200">
                <TicketCheckIcon className="w-12 h-12 text-green-600" />
                <div className="text-center space-y-2">
                    <h3 className="font-bold text-lg text-green-900 dark:text-green-100">Registration Successful!</h3>
                    <p className="text-sm text-green-800 dark:text-green-200">Your Reference Number:</p>
                    <div className="text-2xl font-mono tracking-widest bg-white dark:bg-black p-2 rounded shadow-sm border font-bold">
                        {successRef}
                    </div>
                </div>
                <p className="text-xs text-center text-muted-foreground w-64">
                    Save this number. Use the <strong>Status Checker</strong> in the navigation bar to pay, view your ticket, and get your certificate.
                </p>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => window.print()}>
                        <PrinterIcon className="w-4 h-4 mr-2" /> Print
                    </Button>
                    <Button size="sm" asChild>
                        <Link href={`/status/${successRef}`}>Go to Status Checker</Link>
                    </Button>
                </div>
            </div>
        )
    }

    const renderCustomFields = (valuesObj: Record<string, string>, onChange: (id: string, val: string) => void) => {
        if (!formSchema || formSchema.length === 0) return null

        return formSchema.map(field => (
            <div key={field.id} className="space-y-2">
                <Label>{field.label} {field.required && <span className="text-red-500">*</span>}</Label>
                {field.type === 'dropdown' ? (
                    <select
                        required={field.required}
                        value={valuesObj[field.id] || ''}
                        onChange={(e) => onChange(field.id, e.target.value)}
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <option value="" disabled>Select an option</option>
                        {field.options?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                ) : (
                    <Input
                        type={field.type === 'number' ? 'number' : 'text'}
                        required={field.required}
                        value={valuesObj[field.id] || ''}
                        onChange={(e) => onChange(field.id, e.target.value)}
                        placeholder={`Enter ${field.label}`}
                    />
                )}
            </div>
        ))
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button size="lg" className="w-full sm:w-auto mt-4 mx-auto block">Register as Guest</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isTeamEvent ? 'Team Registration' : 'Event Registration'}</DialogTitle>
                    <DialogDescription>
                        Fill out your details below. {isTeamEvent && `Min team size is ${minTeamSize}, Max ${maxTeamSize}.`} No login required.
                    </DialogDescription>
                </DialogHeader>
                <form action={onSubmit} className="space-y-6 pt-4">
                    <input type="hidden" name="eventId" value={eventId} />

                    <div className="space-y-4 border p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border-blue-200">
                        <h4 className="font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-2">
                            <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">1</span>
                            {isTeamEvent ? 'Team Leader Details' : 'Your Details'}
                        </h4>

                        {!disabledFields.includes('regNo') && (
                            <div className="space-y-2">
                                <Label htmlFor="guestRegNo">Registration Number <span className="text-red-500">*</span></Label>
                                <Input id="guestRegNo" name="guestRegNo" required placeholder="9921004XXX" />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="guestName">Full Name <span className="text-red-500">*</span></Label>
                            <Input id="guestName" name="guestName" required placeholder="John Doe" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="guestEmail">Email Address <span className="text-red-500">*</span></Label>
                            <Input id="guestEmail" name="guestEmail" type="email" required placeholder="john@example.com" />
                        </div>

                        {!disabledFields.includes('phone') && (
                            <div className="space-y-2">
                                <Label htmlFor="guestPhone">Phone Number <span className="text-red-500">*</span></Label>
                                <Input id="guestPhone" name="guestPhone" type="tel" required placeholder="+1 234 567 8900" />
                            </div>
                        )}

                        {!disabledFields.includes('institution') && (
                            <div className="space-y-2">
                                <Label htmlFor="guestInstitution">Institution / Company</Label>
                                <Input id="guestInstitution" name="guestInstitution" placeholder="Kalasalingam Academy" />
                            </div>
                        )}

                        {formSchema.length > 0 && (
                            <div className="pt-2 border-t mt-4 space-y-4">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Additional Information</p>
                                {renderCustomFields(leaderCustomResponses, handleLeaderCustomChange)}
                            </div>
                        )}
                    </div>

                    {isTeamEvent && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b pb-2">
                                <h4 className="font-semibold flex items-center gap-2 text-purple-700 dark:text-purple-400">
                                    <UsersIcon className="h-5 w-5" /> Team Members ({currentTotalSize}/{maxTeamSize})
                                </h4>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addTeamMember}
                                    disabled={currentTotalSize >= maxTeamSize}
                                >
                                    <PlusIcon className="w-4 h-4 mr-1" /> Add Member
                                </Button>
                            </div>

                            {teamMembers.length === 0 && minTeamSize > 1 && (
                                <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded border border-red-100">
                                    You must add at least {minTeamSize - 1} more member(s).
                                </p>
                            )}

                            {teamMembers.map((member, index) => (
                                <div key={member.id} className="border p-4 rounded-lg bg-white dark:bg-black relative shadow-sm">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-2 right-2 text-red-500 hover:bg-red-50 hover:text-red-700"
                                        onClick={() => removeTeamMember(member.id)}
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </Button>

                                    <h5 className="font-medium text-sm text-muted-foreground mb-4">Member {index + 2}</h5>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Full Name <span className="text-red-500">*</span></Label>
                                            <Input
                                                required
                                                value={member.guestName}
                                                onChange={e => updateTeamMember(member.id, 'guestName', e.target.value)}
                                                placeholder="Jane Smith"
                                            />
                                        </div>
                                        {teamMemberSettings?.requireEmail && (
                                            <div className="space-y-2">
                                                <Label>Email Address <span className="text-red-500">*</span></Label>
                                                <Input
                                                    type="email"
                                                    required
                                                    value={member.guestEmail}
                                                    onChange={e => updateTeamMember(member.id, 'guestEmail', e.target.value)}
                                                    placeholder="jane@example.com"
                                                />
                                            </div>
                                        )}
                                        {teamMemberSettings?.requirePhone && (
                                            <div className="space-y-2">
                                                <Label>Phone Number <span className="text-red-500">*</span></Label>
                                                <Input
                                                    type="tel"
                                                    required
                                                    value={member.guestPhone}
                                                    onChange={e => updateTeamMember(member.id, 'guestPhone', e.target.value)}
                                                    placeholder="+1 234 567 8900"
                                                />
                                            </div>
                                        )}
                                        {teamMemberSettings?.requireRegNo && (
                                            <div className="space-y-2">
                                                <Label>Registration Number <span className="text-red-500">*</span></Label>
                                                <Input
                                                    required
                                                    value={member.guestRegNo || ''}
                                                    onChange={e => updateTeamMember(member.id, 'guestRegNo', e.target.value)}
                                                    placeholder="9921004XXX"
                                                />
                                            </div>
                                        )}
                                        {teamMemberSettings?.requireInstitution && (
                                            <div className="space-y-2">
                                                <Label>Institution / Company <span className="text-red-500">*</span></Label>
                                                <Input
                                                    required
                                                    value={member.guestInstitution}
                                                    onChange={e => updateTeamMember(member.id, 'guestInstitution', e.target.value)}
                                                    placeholder="University or Company"
                                                />
                                            </div>
                                        )}
                                        {teamMemberSettings?.askCustomFields && formSchema.length > 0 && (
                                            <div className="pt-2 border-t mt-4 space-y-4">
                                                {renderCustomFields(
                                                    member.customResponses,
                                                    (fieldId, val) => updateTeamMemberCustom(member.id, fieldId, val)
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="pt-4 flex justify-end sticky bottom-0 bg-background/95 pb-4 backdrop-blur">
                        <Button type="submit" disabled={loading || (isTeamEvent && currentTotalSize < minTeamSize)} className="w-full sm:w-auto">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Registration
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
