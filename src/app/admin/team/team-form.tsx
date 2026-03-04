'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { addTeamMember, updateTeamMember } from './actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

// Auto-compress and square-crop image using Canvas
const processImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = (e) => {
            const img = new Image()
            img.src = e.target?.result as string
            img.onload = () => {
                const canvas = document.createElement('canvas')
                const MAX_SIZE = 600

                // Calculate crop to make it square
                let srcSize = Math.min(img.width, img.height)
                let srcX = (img.width - srcSize) / 2
                let srcY = (img.height - srcSize) / 2

                canvas.width = MAX_SIZE
                canvas.height = MAX_SIZE
                const ctx = canvas.getContext('2d')

                if (!ctx) return reject(new Error('Canvas ctx null'))

                // Draw cropped image onto 600x600 canvas
                ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, MAX_SIZE, MAX_SIZE)

                // Compress heavily to WebP to save Supabase storage
                canvas.toBlob(blob => {
                    if (blob) resolve(blob)
                    else reject(new Error('Blob failed'))
                }, 'image/webp', 0.8)
            }
        }
        reader.onerror = reject
    })
}

export default function TeamForm({ member, onClose }: { member?: any, onClose: () => void }) {
    const isEdit = !!member
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [fileError, setFileError] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()
    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)
        setFileError('')

        try {
            const formData = new FormData(e.currentTarget)
            let finalImageUrl = member?.image_url || null

            // 1. Handle Client-Side Image Processing & Upload
            const file = fileInputRef.current?.files?.[0]
            if (file) {
                if (file.size > 10 * 1024 * 1024) {
                    setFileError('File covers absolute limit of 10MB.')
                    throw new Error('File too large')
                }

                toast.loading('Compressing image...', { id: 'upload' })

                // Compress & Crop
                const compressedBlob = await processImage(file)

                // Upload to Supabase 'team_images' bucket
                const filename = `${crypto.randomUUID()}.webp`
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('team_images')
                    .upload(filename, compressedBlob, {
                        contentType: 'image/webp',
                        upsert: false
                    })

                if (uploadError) {
                    console.error("Upload error details:", uploadError)
                    throw new Error(`Upload failed: ${uploadError.message}`)
                }

                // Get Public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('team_images')
                    .getPublicUrl(filename)

                finalImageUrl = publicUrl
                toast.success('Image optimized & uploaded!', { id: 'upload' })

                formData.set('image_url', finalImageUrl)
            }

            // 2. Transmit to Action
            let res;
            if (isEdit) {
                res = await updateTeamMember(member.id, formData)
            } else {
                res = await addTeamMember(formData)
            }

            if (res.error) {
                throw new Error(res.error)
            }

            toast.success(`Team member ${isEdit ? 'updated' : 'added'} successfully.`)
            onClose()

        } catch (error: any) {
            toast.error(error.message || 'Failed to submit', { id: 'upload' })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" name="name" required defaultValue={member?.name} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="role">Role / Position *</Label>
                <select
                    id="role"
                    name="role"
                    required
                    defaultValue={member?.role || ''}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <option value="" disabled>Select a position</option>
                    <option value="Faculty Head">Faculty Head</option>
                    <option value="Chairman">Chairman</option>
                    <option value="Vice Chairman">Vice Chairman</option>
                    <option value="Secretary">Secretary</option>
                    <option value="Treasurer">Treasurer</option>
                    <option value="PR & Outreach Lead">PR & Outreach Lead</option>
                    <option value="Web Development Lead">Web Development Lead</option>
                    <option value="Technical Activities Lead">Technical Activities Lead</option>
                    <option value="Design & Media Lead">Design & Media Lead</option>
                    <option value="Event Co-ordinator Team">Event Co-ordinator Team</option>
                    <option value="PR & Outreach Team">PR & Outreach Team</option>
                    <option value="Technical Activities Team">Technical Activities Team</option>
                    <option value="Web Development Team">Web Development Team</option>
                    <option value="Design & Media Team">Design & Media Team</option>
                    <option value="Volunteer">Volunteer</option>
                </select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="image">Profile Photo (Auto-Square & Compressed)</Label>
                <Input
                    ref={fileInputRef}
                    id="image"
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">Original wide/tall images will be cropped to a center square.</p>
                {fileError && <p className="text-xs text-red-500">{fileError}</p>}
                {member?.image_url && !fileError && (
                    <p className="text-xs text-blue-600">Current image exists. Uploading a new one overwrites it.</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="bio">Bio *</Label>
                <Textarea id="bio" name="bio" required defaultValue={member?.bio} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="display_order">Display Order Number</Label>
                    <Input id="display_order" name="display_order" type="number" defaultValue={member?.display_order || 0} />
                    <p className="text-xs text-muted-foreground">Lower numbers appear first on the page.</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div className="space-y-2">
                    <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                    <Input id="linkedin_url" name="linkedin_url" type="url" defaultValue={member?.linkedin_url} placeholder="https://..." />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="github_url">GitHub URL</Label>
                    <Input id="github_url" name="github_url" type="url" defaultValue={member?.github_url} placeholder="https://..." />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="twitter_url">Twitter/X URL</Label>
                    <Input id="twitter_url" name="twitter_url" type="url" defaultValue={member?.twitter_url} placeholder="https://..." />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="instagram_url">Instagram URL</Label>
                    <Input id="instagram_url" name="instagram_url" type="url" defaultValue={member?.instagram_url} placeholder="https://..." />
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {isEdit ? 'Save Changes' : 'Add Team Member'}
                </Button>
            </div>
        </form>
    )
}
