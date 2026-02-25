'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { TrashIcon, Loader2, AlertTriangleIcon } from 'lucide-react'
import { deleteEvent } from '../actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

export function DeleteEventButton({ eventId, eventTitle }: { eventId: string, eventTitle: string }) {
    const [isDeleting, setIsDeleting] = useState(false)
    const [open, setOpen] = useState(false)
    const router = useRouter()

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            const result = await deleteEvent(eventId)

            if (result.error) {
                toast.error(result.error)
            } else if (result.message) {
                toast.info(result.message) // Handle the case where a non-super admin requests deletion
                setOpen(false)
            } else {
                toast.success('Event and all related data successfully deleted permanently.')
                router.push('/admin/events')
            }
        } catch (error: any) {
            console.error('Delete Event Error:', error)
            toast.error(error.message || 'An unexpected error occurred during deletion.')
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="destructive">
                    <TrashIcon className="w-4 h-4 mr-2" />
                    Delete Event
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center text-red-600 gap-2">
                        <AlertTriangleIcon className="w-5 h-5" />
                        Permanently Delete Event?
                    </DialogTitle>
                    <DialogDescription asChild>
                        <div className="space-y-3 pt-4 text-slate-700">
                            <p>
                                You are about to permanently delete the event <strong>"{eventTitle}"</strong>.
                            </p>
                            <p className="font-semibold text-red-600">
                                WARNING: This action cannot be undone. It will permanently delete all associated data, including:
                            </p>
                            <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
                                <li>All user registrations</li>
                                <li>All payment records and proofs</li>
                                <li>All attendance logs</li>
                                <li>All generated certificates and templates</li>
                                <li>Any pending approval requests</li>
                            </ul>
                        </div>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4 gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={isDeleting}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                        {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <TrashIcon className="w-4 h-4 mr-2" />}
                        Confirm Deletion
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
