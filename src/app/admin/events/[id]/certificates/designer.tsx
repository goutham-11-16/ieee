'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { saveTemplate, lockTemplate, generateCertificates } from './actions'
import { toast } from 'sonner'
import { Loader2, LockIcon, UnlockIcon, Wand2Icon } from 'lucide-react'

// Default Config
const DEFAULT_CONFIG = {
    elements: [
        { field: 'participant_name', x: 300, y: 300, size: 24, align: 'center' },
        { field: 'event_name', x: 300, y: 250, size: 18, align: 'center' },
        { field: 'date', x: 300, y: 200, size: 14, align: 'center' },
        { field: 'unique_code', x: 50, y: 50, size: 10, align: 'left' }
    ]
}

export default function TemplateDesigner({ eventId, existingTemplate }: { eventId: string, existingTemplate: any }) {
    const [loading, setLoading] = useState(false)
    const [config, setConfig] = useState<any>(existingTemplate?.layout_config || DEFAULT_CONFIG)
    const [isLocked, setIsLocked] = useState(existingTemplate?.is_locked || false)

    async function onSave(formData: FormData) {
        setLoading(true)
        try {
            formData.append('eventId', eventId)
            formData.append('config', JSON.stringify(config))

            const result = await saveTemplate(formData)
            if (result.error) toast.error(result.error)
            else toast.success('Template saved!')
        } catch (e) {
            toast.error('Failed to save')
        } finally {
            setLoading(false)
        }
    }

    async function onLock() {
        if (!confirm('Are you sure? Locking prevents further edits and enables generation.')) return
        setLoading(true)
        try {
            const result = await lockTemplate(existingTemplate.id) as any
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(result.message || 'Action successful')
                if (result.message?.includes('locked')) {
                    setIsLocked(true)
                }
            }
        } catch (e) {
            toast.error('Failed to lock')
        } finally {
            setLoading(false)
        }
    }

    async function onGenerate() {
        if (!confirm('Generate certificates for all attended participants?')) return
        setLoading(true)
        try {
            const result = await generateCertificates(eventId)
            if (result.error) toast.error(result.error)
            else toast.success(`Generated ${result.count} certificates!`)
        } catch (e) {
            toast.error('Failed to generate')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Preview & Upload</CardTitle>
                </CardHeader>
                <CardContent>
                    <form action={onSave} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Background PDF/Image</Label>
                            <Input
                                type="file"
                                name="background"
                                accept="application/pdf, image/*"
                                disabled={isLocked}
                            />
                            {existingTemplate?.background_url && (
                                <p className="text-xs text-muted-foreground">Current: {existingTemplate.background_url}</p>
                            )}
                        </div>

                        <div className="border border-dashed p-10 text-center rounded bg-slate-50 dark:bg-slate-900/50">
                            <p className="text-muted-foreground">
                                Visual Designer Placeholder <br />
                                (In a full version, this would be a canvas editor)
                            </p>
                        </div>

                        {!isLocked && (
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Template
                            </Button>
                        )}
                    </form>
                </CardContent>
            </Card>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Configuration (JSON)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <textarea
                            className="w-full h-64 p-2 font-mono text-xs border rounded bg-slate-950 text-slate-50"
                            value={JSON.stringify(config, null, 2)}
                            onChange={(e) => !isLocked && setConfig(JSON.parse(e.target.value))}
                            disabled={isLocked}
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                            Adjust coordinates (x, y) manually for now.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {isLocked ? (
                            <>
                                <Button className="w-full" variant="secondary" disabled>
                                    <LockIcon className="mr-2 h-4 w-4" /> Template Locked
                                </Button>
                                <Button onClick={onGenerate} disabled={loading} className="w-full">
                                    <Wand2Icon className="mr-2 h-4 w-4" /> Generate Certificates
                                </Button>
                            </>
                        ) : (
                            <Button onClick={onLock} disabled={loading || !existingTemplate} className="w-full" variant="outline">
                                <UnlockIcon className="mr-2 h-4 w-4" /> Lock Template
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
