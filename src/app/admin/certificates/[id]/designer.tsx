'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { saveTemplate, requestTemplateLock } from '../actions'
import { Loader2, PlusIcon, Trash2Icon, UploadCloudIcon, LockIcon, SaveIcon } from 'lucide-react'

type ConfigElement = {
    id: string
    tag: string
    x: number
    y: number // using standard cartesian where 0 is bottom
    size: number
    color: string
    font: string
}

const getCssFontFamily = (pdfFont: string) => {
    if (pdfFont?.includes('Courier')) return 'Courier, monospace'
    if (pdfFont?.includes('Times')) return '"Times New Roman", Times, serif'
    return 'Helvetica, Arial, sans-serif'
}

const getCssFontStyle = (pdfFont: string) => {
    if (pdfFont?.includes('Italic') || pdfFont?.includes('Oblique')) return 'italic'
    return 'normal'
}

const getCssFontWeight = (pdfFont: string) => {
    if (pdfFont?.includes('Bold')) return 'bold'
    return 'normal'
}

export default function CertificateDesigner({ eventId, existingTemplate }: { eventId: string, existingTemplate: any }) {
    const supabase = createClient()
    const [isUploading, setIsUploading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isLocking, setIsLocking] = useState(false)

    const [backgroundUrl, setBackgroundUrl] = useState<string>(existingTemplate?.background_url || '')
    const [config, setConfig] = useState<ConfigElement[]>(existingTemplate?.layout_config || [])

    const isLocked = existingTemplate?.is_locked

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0] || isLocked) return
        setIsUploading(true)

        const file = e.target.files[0]
        const ext = file.name.split('.').pop()
        const fileName = `templates/${eventId}-${Date.now()}.${ext}`

        try {
            const { data, error } = await supabase.storage
                .from('certificates')
                .upload(fileName, file, { upsert: true })

            if (error) throw error

            const { data: publicUrlData } = supabase.storage
                .from('certificates')
                .getPublicUrl(fileName)

            setBackgroundUrl(publicUrlData.publicUrl)

            // Auto-populate default tags for professional layout start
            if (config.length === 0) {
                setConfig([
                    { id: '1', tag: '{name}', x: 400, y: 350, size: 48, color: '#1f2937', font: 'Helvetica' },
                    { id: '2', tag: '{eventName}', x: 400, y: 250, size: 24, color: '#4b5563', font: 'Helvetica' },
                    { id: '3', tag: '{date}', x: 200, y: 150, size: 16, color: '#6b7280', font: 'Helvetica' },
                    { id: '4', tag: '{regno}', x: 600, y: 150, size: 16, color: '#6b7280', font: 'Helvetica' }
                ])
            }

            toast.success("Template uploaded successfully")
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsUploading(false)
        }
    }

    const addElement = () => {
        if (isLocked) return
        setConfig([...config, {
            id: Date.now().toString(),
            tag: '{name}',
            x: 400,
            y: 300,
            size: 24,
            color: '#000000',
            font: 'Helvetica'
        }])
    }

    const updateElement = (id: string, field: keyof ConfigElement, value: any) => {
        if (isLocked) return
        setConfig(config.map(c => c.id === id ? { ...c, [field]: value } : c))
    }

    const removeElement = (id: string) => {
        if (isLocked) return
        setConfig(config.filter(c => c.id !== id))
    }

    const handleSave = async () => {
        setIsSaving(true)
        const res = await saveTemplate(eventId, backgroundUrl, config)
        if (res.success) {
            toast.success("Template saved!")
        } else {
            toast.error(res.error)
        }
        setIsSaving(false)
    }

    const handleLock = async () => {
        setIsLocking(true)
        const res = await requestTemplateLock(eventId)
        if (res.success) {
            toast.success("Lock requested successfully")
        } else {
            toast.error(res.error)
        }
        setIsLocking(false)
    }

    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-1 space-y-6">
                <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-200">
                    <CardHeader>
                        <CardTitle className="text-xl text-blue-700 dark:text-blue-400">Professional Guidelines</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-blue-800 dark:text-blue-300 space-y-3">
                        <p><strong>1. Blank Certificate:</strong> Start by uploading a high-resolution, blank Certificate of Participation (PNG or JPG recommended) without names or dates.</p>
                        <p><strong>2. Placeholders:</strong> Add text placeholders. Use `{'{name}'}` for the participant's name, `{'{regno}'}` for Registration Number, `{'{eventName}'}` for the event title, and `{'{date}'}` for the event date.</p>
                        <p><strong>3. Positioning:</strong> Position the placeholders using X and Y coordinate fields. This uses standard PDF coordinates: <strong>X is pixels from left</strong>, and <strong>Y is pixels from bottom</strong> of the page.</p>
                        <p><strong>4. Typography:</strong> Select an appropriate professional font size (e.g., 24px-36px for Name, 16px for Date) and hex color (e.g., #000000).</p>
                        <p><strong>5. Approval:</strong> Once complete, request a Lock on the template to allow the system to safely generate certificates in mass.</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Configuration</CardTitle>
                        <CardDescription>Setup your fields based on the preview.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Background Image</Label>
                            {!backgroundUrl && (
                                <Input type="file" accept="image/*,application/pdf" onChange={handleUpload} disabled={isUploading || isLocked} />
                            )}
                            {backgroundUrl && (
                                <div className="flex gap-2 items-center">
                                    <span className="text-sm text-green-600 font-medium truncate">File Uploaded</span>
                                    {!isLocked && (
                                        <Button variant="outline" size="sm" onClick={() => setBackgroundUrl('')}>Replace</Button>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="pt-4 border-t">
                            <div className="flex justify-between items-center mb-4">
                                <Label className="text-base">Placeholders</Label>
                                <Button size="sm" variant="outline" onClick={addElement} disabled={isLocked || !backgroundUrl}>
                                    <PlusIcon className="w-4 h-4 mr-1" /> Add
                                </Button>
                            </div>

                            <div className="h-[400px] pr-4 overflow-y-auto">
                                <div className="space-y-4">
                                    {config.map((elem, idx) => (
                                        <div key={elem.id} className="p-3 border rounded-md bg-slate-50 dark:bg-slate-900/50 space-y-3 relative">
                                            <div className="absolute top-2 right-2 flex items-center gap-1">
                                                <span className="text-xs font-mono text-muted-foreground mr-2">#{idx + 1}</span>
                                                {!isLocked && (
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => removeElement(elem.id)}>
                                                        <Trash2Icon className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-3 gap-2 pr-8">
                                                <div className="col-span-3 space-y-1">
                                                    <Label className="text-xs">Tag</Label>
                                                    <Select value={elem.tag} onValueChange={(val) => updateElement(elem.id, 'tag', val)} disabled={isLocked}>
                                                        <SelectTrigger className="h-8 text-xs font-mono">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="{name}">{'{name}'} (Participant)</SelectItem>
                                                            <SelectItem value="{regno}">{'{regno}'} (Registration No)</SelectItem>
                                                            <SelectItem value="{eventName}">{'{eventName}'} (Event Title)</SelectItem>
                                                            <SelectItem value="{date}">{'{date}'} (Event Date)</SelectItem>
                                                            <SelectItem value="{uniqueCode}">{'{uniqueCode}'} (UUID)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">X (left)</Label>
                                                    <Input type="number" className="h-8 text-xs font-mono" value={elem.x} onChange={e => updateElement(elem.id, 'x', parseInt(e.target.value) || 0)} disabled={isLocked} />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Y (bottom)</Label>
                                                    <Input type="number" className="h-8 text-xs font-mono" value={elem.y} onChange={e => updateElement(elem.id, 'y', parseInt(e.target.value) || 0)} disabled={isLocked} />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Size</Label>
                                                    <Input type="number" className="h-8 text-xs" value={elem.size} onChange={e => updateElement(elem.id, 'size', parseInt(e.target.value) || 0)} disabled={isLocked} />
                                                </div>
                                                <div className="col-span-2 space-y-1">
                                                    <Label className="text-xs">Font</Label>
                                                    <Select value={elem.font} onValueChange={(val) => updateElement(elem.id, 'font', val)} disabled={isLocked}>
                                                        <SelectTrigger className="h-8 text-xs font-mono">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Helvetica">Helvetica</SelectItem>
                                                            <SelectItem value="HelveticaBold">Helvetica Bold</SelectItem>
                                                            <SelectItem value="HelveticaOblique">Helvetica Italic (Oblique)</SelectItem>
                                                            <SelectItem value="HelveticaBoldOblique">Helvetica Bold Italic</SelectItem>
                                                            <SelectItem value="TimesRoman">Times Roman</SelectItem>
                                                            <SelectItem value="TimesBold">Times Bold</SelectItem>
                                                            <SelectItem value="TimesItalic">Times Italic</SelectItem>
                                                            <SelectItem value="TimesBoldItalic">Times Bold Italic</SelectItem>
                                                            <SelectItem value="Courier">Courier</SelectItem>
                                                            <SelectItem value="CourierBold">Courier Bold</SelectItem>
                                                            <SelectItem value="CourierOblique">Courier Italic</SelectItem>
                                                            <SelectItem value="CourierBoldOblique">Courier Bold Italic</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Color</Label>
                                                    <div className="flex items-center gap-1">
                                                        <input type="color" className="h-8 w-8 p-0 border-0 rounded cursor-pointer" value={elem.color} onChange={e => updateElement(elem.id, 'color', e.target.value)} disabled={isLocked} />
                                                        <Input className="h-8 text-xs font-mono px-1" value={elem.color} onChange={e => updateElement(elem.id, 'color', e.target.value)} disabled={isLocked} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {config.length === 0 && (
                                        <div className="text-sm text-muted-foreground text-center py-4">No placeholders added yet.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={isSaving || isLocked || !backgroundUrl} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <SaveIcon className="w-4 h-4 mr-2" />} Save Progress
                    </Button>
                    {isLocked ? (
                        <Button disabled variant="outline" className="flex-1 border-green-500 text-green-600 opacity-100">
                            <LockIcon className="w-4 h-4 mr-2" /> Locked
                        </Button>
                    ) : (
                        <Button onClick={handleLock} disabled={isLocking || !backgroundUrl || config.length === 0} variant="outline" className="flex-1 border-emerald-600 text-emerald-600 hover:bg-emerald-50">
                            {isLocking ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LockIcon className="w-4 h-4 mr-2" />} Request Lock
                        </Button>
                    )}
                </div>
            </div>

            <div className="xl:col-span-2">
                <Card className="h-full min-h-[600px] flex flex-col">
                    <CardHeader>
                        <CardTitle>Visual Reference</CardTitle>
                        <CardDescription>A live preview of your coordinates relative to the original image dimensions. Move the X and Y coordinate fields to move the tags!</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 bg-slate-100 dark:bg-slate-900 border-t flex items-center justify-center p-4 overflow-auto">
                        {backgroundUrl ? (
                            <div className="relative border shadow-xl bg-white max-w-full overflow-hidden" style={{ minHeight: '400px', minWidth: '600px' }}>
                                <img src={backgroundUrl} alt="Certificate Base" className="w-full h-auto pointer-events-none" />

                                {/* Live Overlay of tags */}
                                {config.map((el) => (
                                    <div key={el.id}
                                        className="absolute px-2 py-1 whitespace-nowrap border-2 border-dashed border-blue-500 bg-white/70 backdrop-blur-sm shadow-sm"
                                        style={{
                                            left: `${el.x}px`,
                                            bottom: `${el.y}px`,
                                            fontSize: `${el.size || 24}px`,
                                            color: el.color || '#000000',
                                            transform: 'translateY(50%)', // Center alignment baseline rough adjust
                                            fontFamily: getCssFontFamily(el.font),
                                            fontStyle: getCssFontStyle(el.font),
                                            fontWeight: getCssFontWeight(el.font)
                                        }}
                                    >
                                        {el.tag}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-muted-foreground flex flex-col items-center justify-center gap-4">
                                <UploadCloudIcon className="w-16 h-16 opacity-50" />
                                <p>Upload a background template to begin design layout.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
