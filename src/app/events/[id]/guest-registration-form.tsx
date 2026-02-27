'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { registerGuest } from './actions'
import { toast } from 'sonner'
import { Loader2, TicketCheckIcon, PrinterIcon, UsersIcon, PlusIcon, TrashIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'

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
    baseFee = 0,
    isFeePerPerson = false,
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
    baseFee?: number
    isFeePerPerson?: boolean
    teamMemberSettings?: {
        requireEmail: boolean
        requirePhone: boolean
        requireInstitution: boolean
        requireRegNo: boolean
        askCustomFields: boolean
    }
}) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    // Custom responses for the Team Leader
    const [leaderCustomResponses, setLeaderCustomResponses] = useState<Record<string, string>>({})

    // Team Members Array
    const [teamMembers, setTeamMembers] = useState<any[]>([])

    const now = new Date()
    const isRegistrationClosed = registrationEnd ? new Date(registrationEnd) < now : new Date(eventDate) < now

    const [leaderInstitutionType, setLeaderInstitutionType] = useState<string>('')

    const handleLeaderCustomChange = (id: string, value: string) => {
        setLeaderCustomResponses(prev => ({ ...prev, [id]: value }))
    }

    const addTeamMember = () => {
        if (teamMembers.length + 1 >= maxTeamSize) return
        setTeamMembers([
            ...teamMembers,
            { id: Date.now().toString(), guestName: '', guestEmail: '', guestPhone: '', guestInstitution: '', institutionType: '', customResponses: {} }
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
    const totalFee = (baseFee || 0) * (isFeePerPerson ? currentTotalSize : 1)

    async function onSubmit(formData: FormData) {
        if (isTeamEvent && currentTotalSize < minTeamSize) {
            toast.error(`This is a team event. You must have at least ${minTeamSize} members.`)
            return
        }

        setLoading(true)
        try {
            // Fix up leader institution if they chose KARE
            if (leaderInstitutionType === 'KARE') {
                formData.set('guestInstitution', 'Kalasalingam Academy of Research and Education (KARE)')
            }

            // Fix up team members if they chose KARE
            const formattedTeamMembers = teamMembers.map(m => ({
                ...m,
                guestInstitution: m.institutionType === 'KARE' ? 'Kalasalingam Academy of Research and Education (KARE)' : m.guestInstitution
            }))

            // Package the dynamic data as JSON strings to send nicely to the server action
            formData.append('customResponses', JSON.stringify(leaderCustomResponses))
            formData.append('teamMembers', JSON.stringify(formattedTeamMembers))

            const result = await registerGuest(formData)
            if (result.error) {
                toast.error(result.error)
            } else {
                if (result.isPaidEvent) {
                    toast.success('Seat reserved! Complete payment within 5 mins.')
                    router.push(`/events/${eventId}/pay/${result.registrationId}`)
                } else {
                    toast.success('Registration saved! Redirecting to receipt...')
                    router.push(`/status/${result.referenceNumber}?new=1`)
                }
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

    // Success state is now handled by redirect

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
        <div className="w-full">
            <div className="mb-6">
                <h2 className="text-2xl font-bold">{isTeamEvent ? 'Team Registration' : 'Event Registration'}</h2>
                <p className="text-muted-foreground">
                    Fill out your details below. {isTeamEvent && `Min team size is ${minTeamSize}, Max ${maxTeamSize}.`} No login required.
                </p>
            </div>
            <form action={onSubmit} className="space-y-6">
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
                        <div className="space-y-4 border-l-2 border-slate-200 pl-3 ml-1">
                            <div className="space-y-2">
                                <Label htmlFor="leaderInstitutionType">Institution / Company</Label>
                                <select
                                    id="leaderInstitutionType"
                                    name="leaderInstitutionType"
                                    required
                                    value={leaderInstitutionType}
                                    onChange={(e) => setLeaderInstitutionType(e.target.value)}
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="" disabled>Select your institution</option>
                                    <option value="KARE">Kalasalingam Academy of Research and Education (KARE)</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            {leaderInstitutionType === 'Other' && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <Label htmlFor="guestInstitution">Specify Institution Name <span className="text-red-500">*</span></Label>
                                    <Input id="guestInstitution" name="guestInstitution" required placeholder="Your University or Company" />
                                </div>
                            )}
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
                                        <div className="space-y-4 border-l-2 border-slate-200 pl-3 ml-1">
                                            <div className="space-y-2">
                                                <Label>Institution / Company <span className="text-red-500">*</span></Label>
                                                <select
                                                    required
                                                    value={member.institutionType || ''}
                                                    onChange={e => updateTeamMember(member.id, 'institutionType', e.target.value)}
                                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <option value="" disabled>Select institution</option>
                                                    <option value="KARE">Kalasalingam Academy of Research and Education (KARE)</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </div>
                                            {member.institutionType === 'Other' && (
                                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                                    <Label>Specify Institution Name <span className="text-red-500">*</span></Label>
                                                    <Input
                                                        required
                                                        value={member.guestInstitution || ''}
                                                        onChange={e => updateTeamMember(member.id, 'guestInstitution', e.target.value)}
                                                        placeholder="University or Company"
                                                    />
                                                </div>
                                            )}
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

                {baseFee ? (
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-lg p-4 flex justify-between items-center mt-4">
                        <span className="font-semibold text-emerald-800 dark:text-emerald-200">Total Registration Fee</span>
                        <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                            ₹{totalFee.toFixed(2)}
                            {isFeePerPerson && <span className="text-xs font-normal text-emerald-600 block text-right mt-1">(₹{baseFee.toFixed(2)} × {currentTotalSize} members)</span>}
                        </span>
                    </div>
                ) : null}

                <div className="pt-4 flex justify-end sticky bottom-0 bg-background/95 pb-4 backdrop-blur">
                    <Button type="submit" disabled={loading || (isTeamEvent && currentTotalSize < minTeamSize)} className="w-full sm:w-auto">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Registration
                    </Button>
                </div>
            </form>
        </div>
    )
}
