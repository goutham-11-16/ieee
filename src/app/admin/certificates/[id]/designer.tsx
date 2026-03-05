'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { saveTemplate, requestTemplateLock, generateCertificates } from '../actions'
import { Loader2, PlusIcon, Trash2Icon, UploadCloudIcon, LockIcon, SaveIcon, Wand2Icon } from 'lucide-react'

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
    if (pdfFont?.includes('Helvetica')) return 'Helvetica, Arial, sans-serif'
    // Fallback for all the custom Google Fonts added
    return `"${pdfFont}", sans-serif`
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

    const imgRef = useRef<HTMLImageElement>(null)
    const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 })
    const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 })

    const handleImageLoad = () => {
        if (imgRef.current) {
            setNaturalSize({
                width: imgRef.current.naturalWidth,
                height: imgRef.current.naturalHeight
            })
            setDisplaySize({
                width: imgRef.current.clientWidth,
                height: imgRef.current.clientHeight
            })
        }
    }

    // Update display size on window resize to keep markers aligned
    useEffect(() => {
        const handleResize = () => {
            if (imgRef.current) {
                setDisplaySize({
                    width: imgRef.current.clientWidth,
                    height: imgRef.current.clientHeight
                })
            }
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [backgroundUrl])

    const addElement = () => {
        if (isLocked) return
        // Default to middle of natural size if available
        const x = naturalSize.width ? Math.round(naturalSize.width / 2) : 400
        const y = naturalSize.height ? Math.round(naturalSize.height / 2) : 300

        setConfig([...config, {
            id: Date.now().toString(),
            tag: '{name}',
            x,
            y,
            size: 48,
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

    const handleGenerate = async () => {
        if (!confirm('Generate certificates for all attended participants?')) return
        setIsSaving(true) // Reuse saving state for simplicity of loading overlay
        try {
            const result = await generateCertificates(eventId)
            if (result?.error || !result?.success) {
                toast.error(result?.error || 'Failed to generate')
            } else {
                toast.success(`Generated ${result.count} certificates! ${(result.exceptions ?? 0) > 0 ? `(${result.exceptions} exceptions)` : ''}`)
            }
        } catch (e) {
            toast.error('Failed to generate certificates')
        } finally {
            setIsSaving(false)
        }
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
                        <p><strong>3. Positioning:</strong> Position the placeholders using X and Y coordinate fields. This uses standard PDF coordinates: <strong>X is pixels from left</strong>, and <strong>Y is pixels from bottom</strong> of the original image.</p>
                        <p><strong>4. Natural Resolution:</strong> {naturalSize.width > 0 ? `Image detected at ${naturalSize.width}x${naturalSize.height}px.` : 'Upload an image to see resolution details.'} coordinates are based on these dimensions.</p>
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
                                        <Button variant="outline" size="sm" onClick={() => { setBackgroundUrl(''); setNaturalSize({ width: 0, height: 0 }); }}>Replace</Button>
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
                                                            <SelectItem value="{refNo}">{'{refNo}'} (Ref No)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">X (from left)</Label>
                                                    <Input type="number" className="h-8 text-xs font-mono" value={elem.x} onChange={e => updateElement(elem.id, 'x', parseInt(e.target.value) || 0)} disabled={isLocked} />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Y (from bottom)</Label>
                                                    <Input type="number" className="h-8 text-xs font-mono" value={elem.y} onChange={e => updateElement(elem.id, 'y', parseInt(e.target.value) || 0)} disabled={isLocked} />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Size (pt)</Label>
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
                                                            <SelectItem value="TimesRoman">Times Roman</SelectItem>
                                                            <SelectItem value="TimesBold">Times Bold</SelectItem>

                                                            <SelectItem disabled value="_basic" className="bg-slate-100 font-bold">--- Sans Serif ---</SelectItem>
                                                            <SelectItem value="Montserrat">Montserrat</SelectItem>
                                                            <SelectItem value="Poppins">Poppins</SelectItem>
                                                            <SelectItem value="Open Sans">Open Sans</SelectItem>
                                                            <SelectItem value="Lato">Lato</SelectItem>
                                                            <SelectItem value="Roboto">Roboto</SelectItem>
                                                            <SelectItem value="Roboto Condensed">Roboto Condensed</SelectItem>
                                                            <SelectItem value="League Spartan">League Spartan</SelectItem>
                                                            <SelectItem value="Raleway">Raleway</SelectItem>
                                                            <SelectItem value="Nunito">Nunito</SelectItem>
                                                            <SelectItem value="Nunito Sans">Nunito Sans</SelectItem>
                                                            <SelectItem value="Inter">Inter</SelectItem>
                                                            <SelectItem value="Glacial Indifference">Glacial Indifference</SelectItem>

                                                            <SelectItem disabled value="_serif" className="bg-slate-100 font-bold">--- Serif ---</SelectItem>
                                                            <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                                                            <SelectItem value="Libre Baskerville">Libre Baskerville</SelectItem>
                                                            <SelectItem value="Merriweather">Merriweather</SelectItem>
                                                            <SelectItem value="Lora">Lora</SelectItem>
                                                            <SelectItem value="Cormorant">Cormorant</SelectItem>
                                                            <SelectItem value="Cinzel">Cinzel</SelectItem>
                                                            <SelectItem value="Prata">Prata</SelectItem>
                                                            <SelectItem value="Bodoni Moda">Bodoni FLF (Moda)</SelectItem>
                                                            <SelectItem value="Abril Fatface">Abril Fatface</SelectItem>

                                                            <SelectItem disabled value="_display" className="bg-slate-100 font-bold">--- Specific/Display ---</SelectItem>
                                                            <SelectItem value="Bebas Neue">Bebas Neue</SelectItem>
                                                            <SelectItem value="Lilita One">Lilita One</SelectItem>
                                                            <SelectItem value="Six Caps">Six Caps</SelectItem>
                                                            <SelectItem value="Pacifico">Pacifico</SelectItem>
                                                            <SelectItem value="Yellowtail">Yellowtail</SelectItem>
                                                            <SelectItem value="Sacramento">Sacramento</SelectItem>
                                                            <SelectItem value="Dancing Script">Dancing Script</SelectItem>
                                                            <SelectItem value="Alex Brush">Alex Brush</SelectItem>
                                                            <SelectItem value="Allura">Allura</SelectItem>

                                                            <SelectItem disabled value="_aesthetic" className="bg-slate-100 font-bold">--- Specialty Fonts ---</SelectItem>
                                                            <SelectItem value="Brittany">Brittany</SelectItem>
                                                            <SelectItem value="Moontime">Moontime</SelectItem>
                                                            <SelectItem value="Gistesy">Gistesy</SelectItem>
                                                            <SelectItem value="Tan Mignon">Tan Aegean / Mignon</SelectItem>
                                                            <SelectItem value="Dream Avenue">Dream Avenue</SelectItem>
                                                            <SelectItem value="Hatton">Hatton</SelectItem>
                                                            <SelectItem value="Black Mango">Black Mango</SelectItem>
                                                            <SelectItem value="Genty">Genty</SelectItem>
                                                            <SelectItem value="Bright Retro">Bright Retro</SelectItem>
                                                            <SelectItem value="Marykate">Marykate</SelectItem>
                                                            <SelectItem value="Mokoto">Mokoto</SelectItem>
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
                        <>
                            <Button disabled variant="outline" className="flex-1 border-green-500 text-green-600 opacity-100">
                                <LockIcon className="w-4 h-4 mr-2" /> Locked
                            </Button>
                            <Button onClick={handleGenerate} disabled={isSaving} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">
                                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2Icon className="w-4 h-4 mr-2" />} Generate
                            </Button>
                        </>
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
                        <CardDescription>Position markers relative to image natural resolution. {naturalSize.width > 0 ? `(Target: ${naturalSize.width}x${naturalSize.height}px)` : ''}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 bg-slate-100 dark:bg-slate-900 border-t flex items-center justify-center p-4 overflow-auto">
                        {backgroundUrl ? (
                            <div className="relative border shadow-xl bg-white max-w-full" style={{ width: 'fit-content' }}>
                                <img
                                    ref={imgRef}
                                    src={backgroundUrl}
                                    alt="Certificate Base"
                                    className="w-full h-auto pointer-events-none block"
                                    onLoad={handleImageLoad}
                                />

                                {/* Live Overlay of tags - calculating relative position based on natural size vs display size */}
                                {naturalSize.width > 0 && config.map((el) => {
                                    // Calculate display ratio
                                    const scaleX = displaySize.width / naturalSize.width;
                                    const scaleY = displaySize.height / naturalSize.height;

                                    return (
                                        <div key={el.id}
                                            className="absolute px-1 whitespace-nowrap border border-dashed border-blue-500 bg-white/50 backdrop-blur-sm pointer-events-none"
                                            style={{
                                                left: `${el.x * scaleX}px`,
                                                // PDF Y is from bottom, so we map natural Y to display bottom
                                                bottom: `${el.y * scaleY}px`,
                                                fontSize: `${el.size * scaleX}px`, // Scale font preview roughly
                                                color: el.color || '#000000',
                                                transform: 'translateY(50%)', // Rough center adjust
                                                fontFamily: getCssFontFamily(el.font),
                                                fontStyle: getCssFontStyle(el.font),
                                                fontWeight: getCssFontWeight(el.font)
                                            }}
                                        >
                                            {el.tag}
                                        </div>
                                    )
                                })}
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

