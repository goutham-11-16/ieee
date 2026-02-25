'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PlusIcon, TrashIcon, UsersIcon, ListIcon } from 'lucide-react'

export type CustomFieldSchema = {
    id: string;
    label: string;
    type: 'text' | 'number' | 'dropdown';
    required: boolean;
    options?: string[]; // For dropdowns
}

export function EventFormBuilder({
    initialIsTeamEvent = false,
    initialDisabledFields = [],
    initialCustomFields = [],
    initialTeamMemberSettings = {
        requireEmail: true,
        requirePhone: false,
        requireInstitution: false,
        requireRegNo: false,
        askCustomFields: false
    }
}: {
    initialIsTeamEvent?: boolean
    initialDisabledFields?: string[]
    initialCustomFields?: CustomFieldSchema[]
    initialTeamMemberSettings?: any
} = {}) {
    const [isTeamEvent, setIsTeamEvent] = useState(initialIsTeamEvent)
    const [disabledFields, setDisabledFields] = useState<string[]>(initialDisabledFields)
    const [customFields, setCustomFields] = useState<CustomFieldSchema[]>(initialCustomFields)
    const [teamMemberSettings, setTeamMemberSettings] = useState(initialTeamMemberSettings)

    const toggleDefaultField = (fieldName: string) => {
        setDisabledFields(prev =>
            prev.includes(fieldName) ? prev.filter(f => f !== fieldName) : [...prev, fieldName]
        )
    }

    const addCustomField = () => {
        setCustomFields([...customFields, {
            id: `field_${Date.now()}`,
            label: 'New Field',
            type: 'text',
            required: false
        }])
    }

    const removeCustomField = (id: string) => {
        setCustomFields(customFields.filter(f => f.id !== id))
    }

    const updateCustomField = (id: string, updates: Partial<CustomFieldSchema>) => {
        setCustomFields(customFields.map(f => f.id === id ? { ...f, ...updates } : f))
    }

    return (
        <div className="space-y-6 mt-6 border-t pt-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
                <ListIcon className="h-5 w-5 text-blue-600" /> Form Configuration
            </h3>

            {/* Hidden Inputs to send data to Server Action */}
            <input type="hidden" name="disabledDefaultFields" value={JSON.stringify(disabledFields)} />
            <input type="hidden" name="formSchema" value={JSON.stringify(customFields)} />
            <input type="hidden" name="teamMemberSettings" value={JSON.stringify(teamMemberSettings)} />

            <div className="bg-slate-50 dark:bg-slate-900 border rounded-lg p-4 space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">Default Guest Fields</h4>
                <div className="flex gap-4">
                    <Label className="flex items-center gap-2 text-sm font-normal cursor-pointer">
                        <input type="checkbox" checked={true} disabled className="rounded text-blue-600 focus:ring-blue-500 bg-gray-200 cursor-not-allowed" />
                        Full Name (Required)
                    </Label>
                    <Label className="flex items-center gap-2 text-sm font-normal cursor-pointer">
                        <input type="checkbox" checked={true} disabled className="rounded text-blue-600 focus:ring-blue-500 bg-gray-200 cursor-not-allowed" />
                        Email Address (Required)
                    </Label>
                    <Label className="flex items-center gap-2 text-sm font-normal cursor-pointer">
                        <input type="checkbox" checked={!disabledFields.includes('phone')} onChange={() => toggleDefaultField('phone')} className="rounded text-blue-600 focus:ring-blue-500" />
                        Phone Number
                    </Label>
                    <Label className="flex items-center gap-2 text-sm font-normal cursor-pointer">
                        <input type="checkbox" checked={!disabledFields.includes('institution')} onChange={() => toggleDefaultField('institution')} className="rounded text-blue-600 focus:ring-blue-500" />
                        Institution/Company
                    </Label>
                    <Label className="flex items-center gap-2 text-sm font-normal cursor-pointer">
                        <input type="checkbox" checked={!disabledFields.includes('regNo')} onChange={() => toggleDefaultField('regNo')} className="rounded text-blue-600 focus:ring-blue-500" />
                        Registration Number
                    </Label>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h4 className="font-medium text-sm text-muted-foreground">Custom Registration Fields</h4>
                    <Button type="button" variant="outline" size="sm" onClick={addCustomField}>
                        <PlusIcon className="h-4 w-4 mr-2" /> Add Field
                    </Button>
                </div>

                {customFields.length === 0 ? (
                    <div className="text-center py-4 bg-slate-50 dark:bg-slate-900 border border-dashed rounded-lg text-sm text-muted-foreground">
                        No custom fields added.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {customFields.map((field, index) => (
                            <div key={field.id} className="flex items-start gap-4 p-3 border rounded-lg bg-background group">
                                <div className="space-y-2 flex-1">
                                    <Input
                                        value={field.label}
                                        onChange={(e) => updateCustomField(field.id, { label: e.target.value })}
                                        placeholder="Field Label (e.g., T-Shirt Size)"
                                        className="font-medium"
                                    />
                                    <div className="flex gap-4 items-center">
                                        <select
                                            value={field.type}
                                            onChange={(e) => updateCustomField(field.id, { type: e.target.value as any })}
                                            className="h-9 w-32 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                                        >
                                            <option value="text">Text Input</option>
                                            <option value="number">Number</option>
                                            <option value="dropdown">Dropdown</option>
                                        </select>

                                        <Label className="flex items-center gap-2 text-sm font-normal">
                                            <input
                                                type="checkbox"
                                                checked={field.required || false}
                                                onChange={(e) => updateCustomField(field.id, { required: e.target.checked })}
                                                className="rounded"
                                            />
                                            Required
                                        </Label>
                                    </div>

                                    {field.type === 'dropdown' && (
                                        <Input
                                            placeholder="Comma-separated options (e.g., Small, Medium, Large)"
                                            value={field.options?.join(', ') || ''}
                                            onChange={(e) => updateCustomField(field.id, {
                                                options: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                                            })}
                                            className="mt-2 text-sm"
                                        />
                                    )}
                                </div>
                                <Button type="button" variant="ghost" size="icon" className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeCustomField(field.id)}>
                                    <TrashIcon className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <h3 className="text-lg font-semibold flex items-center gap-2 mt-8 pt-6 border-t">
                <UsersIcon className="h-5 w-5 text-purple-600" /> Team Registration
            </h3>

            <div className="bg-slate-50 dark:bg-slate-900 border rounded-lg p-4 space-y-4">
                <Label className="flex items-center gap-2 font-medium cursor-pointer mb-4">
                    <input type="checkbox" name="isTeamEvent" checked={isTeamEvent || false} onChange={(e) => setIsTeamEvent(e.target.checked)} className="rounded h-4 w-4 text-purple-600 focus:ring-purple-500" />
                    Enable Team Registrations
                </Label>

                {isTeamEvent && (
                    <div className="space-y-6 pt-2 border-t border-slate-200 dark:border-slate-800">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="minTeamSize">Minimum Team Members (Including Leader)</Label>
                                <Input id="minTeamSize" name="minTeamSize" type="number" min="1" defaultValue="2" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="maxTeamSize">Maximum Team Members (Including Leader)</Label>
                                <Input id="maxTeamSize" name="maxTeamSize" type="number" min="2" defaultValue="4" />
                            </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                            <h4 className="font-medium text-sm text-muted-foreground">Team Member Field Requirements</h4>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-sm font-normal cursor-pointer">
                                    <input type="checkbox" checked={true} disabled className="rounded text-blue-600 focus:ring-blue-500 bg-gray-200 cursor-not-allowed" />
                                    Full Name (Always Required)
                                </Label>
                                <Label className="flex items-center gap-2 text-sm font-normal cursor-pointer">
                                    <input type="checkbox" checked={teamMemberSettings?.requireEmail || false} onChange={(e) => setTeamMemberSettings((p: any) => ({ ...p, requireEmail: e.target.checked }))} className="rounded text-blue-600 focus:ring-blue-500" />
                                    Email Address
                                </Label>
                                <Label className="flex items-center gap-2 text-sm font-normal cursor-pointer">
                                    <input type="checkbox" checked={teamMemberSettings?.requirePhone || false} onChange={(e) => setTeamMemberSettings((p: any) => ({ ...p, requirePhone: e.target.checked }))} className="rounded text-blue-600 focus:ring-blue-500" />
                                    Phone Number
                                </Label>
                                <Label className="flex items-center gap-2 text-sm font-normal cursor-pointer">
                                    <input type="checkbox" checked={teamMemberSettings?.requireInstitution || false} onChange={(e) => setTeamMemberSettings((p: any) => ({ ...p, requireInstitution: e.target.checked }))} className="rounded text-blue-600 focus:ring-blue-500" />
                                    Institution / Company
                                </Label>
                                <Label className="flex items-center gap-2 text-sm font-normal cursor-pointer">
                                    <input type="checkbox" checked={teamMemberSettings?.requireRegNo || false} onChange={(e) => setTeamMemberSettings((p: any) => ({ ...p, requireRegNo: e.target.checked }))} className="rounded text-blue-600 focus:ring-blue-500" />
                                    Registration Number
                                </Label>
                                {customFields.length > 0 && (
                                    <Label className="flex items-center gap-2 text-sm font-normal cursor-pointer">
                                        <input type="checkbox" checked={teamMemberSettings?.askCustomFields || false} onChange={(e) => setTeamMemberSettings((p: any) => ({ ...p, askCustomFields: e.target.checked }))} className="rounded text-purple-600 focus:ring-purple-500" />
                                        Ask all Custom Fields defined above
                                    </Label>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
