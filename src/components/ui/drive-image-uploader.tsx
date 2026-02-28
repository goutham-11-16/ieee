'use client'

import { useState, useRef } from 'react'
import { compressImage } from '@/lib/image-compression'
import { toast } from 'sonner'
import { UploadIcon, CheckCircleIcon, ImageIcon } from 'lucide-react'

function ProgressBar({ progress }: { progress: number }) {
    return (
        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 mb-2 overflow-hidden">
            <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
        </div>
    )
}

interface Props {
    id: string;
    name: string;
    folderName: string;
    eventTitle?: string;
    required?: boolean;
    existingUrl?: string | null;
}

export function DriveImageUploader({ id, name, folderName, eventTitle, required, existingUrl }: Props) {
    const [progress, setProgress] = useState(0)
    const [isUploading, setIsUploading] = useState(false)
    const [fileSizeStr, setFileSizeStr] = useState('')
    const [uploadedUrl, setUploadedUrl] = useState(existingUrl || '')
    const [filename, setFilename] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        setFilename(file.name)
        setFileSizeStr((file.size / (1024 * 1024)).toFixed(2) + ' MB')

        let processFile = file;
        setIsUploading(true)
        setProgress(0)

        try {
            if (file.type.startsWith('image/')) {
                // Compress it softly before uploading
                processFile = await compressImage(file, { maxSizeMB: 0.5, maxWidthOrHeight: 1920 })
            }

            const reader = new FileReader()
            reader.readAsDataURL(processFile)
            reader.onload = () => {
                const result = reader.result as string
                const base64 = result.split(',')[1]
                uploadToDrive(base64, processFile.name, processFile.type)
            }
            reader.onerror = () => {
                toast.error("Failed to read file.")
                setIsUploading(false)
            }
        } catch (err) {
            toast.error("File processing failed")
            setIsUploading(false)
        }
    }

    function uploadToDrive(base64Data: string, filename: string, mimeType: string) {
        const scriptUrl = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL
        if (!scriptUrl) {
            toast.error("Google Apps Script URL is missing.")
            setIsUploading(false)
            return
        }

        const xhr = new XMLHttpRequest()
        xhr.open('POST', scriptUrl, true)
        xhr.setRequestHeader('Content-Type', 'text/plain')

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percent = Math.round((event.loaded / event.total) * 100)
                // Fake a little bit of delay at 100% since GAS takes a moment to process after sending
                setProgress(percent > 95 ? 95 : percent)
            }
        }

        xhr.onload = () => {
            if (xhr.status === 200 || xhr.status === 302) {
                try {
                    const res = JSON.parse(xhr.responseText)
                    if (res.success) {
                        setProgress(100)
                        const url = res.fileId ? `https://drive.google.com/uc?export=download&id=${res.fileId}` : res.url
                        setUploadedUrl(url)
                        toast.success("Image uploaded successfully!")
                    } else {
                        toast.error("Drive upload failed: " + res.error)
                    }
                } catch (e) {
                    toast.error("Invalid response from Drive server")
                }
            } else {
                toast.error("Upload failed with network error")
            }

            // Allow state to settle, hide modal after 500ms
            setTimeout(() => {
                setIsUploading(false)
            }, 500)
        }

        xhr.onerror = () => {
            setIsUploading(false)
            toast.error("Network error during upload")
        }

        // Dynamically get Title from DOM if eventTitle is absent
        let actualEventTitle = eventTitle;
        if (!actualEventTitle) {
            const titleEl = document.getElementById('title') as HTMLInputElement | null;
            actualEventTitle = titleEl?.value ? titleEl.value : 'Misc Uploads';
        }

        xhr.send(JSON.stringify({
            base64Data, filename, mimeType, targetFolder: folderName, eventTitle: actualEventTitle
        }))
    }

    return (
        <div className="space-y-2">
            <input type="hidden" name={name} value={uploadedUrl} />

            {!uploadedUrl && !isUploading && (
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors" onClick={() => fileInputRef.current?.click()}>
                    <UploadIcon className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="text-sm font-medium">Click to select file</p>
                    <p className="text-xs text-muted-foreground mt-1">Image or PDF (Max 5MB)</p>
                </div>
            )}

            {uploadedUrl && !isUploading && (
                <div className="border rounded-lg p-4 flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/20 shadow-sm">
                    <div className="flex items-center gap-3">
                        <CheckCircleIcon className="w-8 h-8 text-emerald-600" />
                        <div>
                            <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">Upload Complete</p>
                            <a href={uploadedUrl} target="_blank" className="text-xs text-emerald-700 hover:underline">View Uploaded File</a>
                        </div>
                    </div>
                    <button type="button" onClick={() => { setUploadedUrl(''); setFilename(''); }} className="text-xs font-semibold text-slate-500 hover:text-slate-700 border px-2 py-1 rounded bg-white dark:bg-slate-800">
                        Change
                    </button>
                </div>
            )}

            {isUploading && (
                <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-2xl w-full max-w-sm border dark:border-slate-800 flex flex-col items-center text-center animate-in fade-in zoom-in-95">
                        <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                            <UploadIcon className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-bounce" />
                        </div>
                        <h3 className="text-xl font-bold mb-1">Uploading File...</h3>
                        <p className="text-sm text-slate-500 mb-6 truncate max-w-full">{filename} ({fileSizeStr})</p>

                        <ProgressBar progress={progress} />
                        <p className="text-xs font-mono font-medium text-blue-600 dark:text-blue-400 mt-2">{progress}% completed</p>

                        <p className="text-xs text-muted-foreground mt-6 border-t pt-4 w-full">Please wait while the file securely uploads. This dialog will close automatically.</p>
                    </div>
                </div>
            )}

            <input
                ref={fileInputRef}
                id={id}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                required={required && !uploadedUrl}
                onChange={handleFileChange}
                disabled={isUploading}
            />
        </div>
    )
}
