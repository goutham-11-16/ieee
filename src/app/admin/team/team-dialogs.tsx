'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { PlusIcon, EditIcon, TrashIcon } from 'lucide-react'
import TeamForm from './team-form'
import { deleteTeamMember } from './actions'
import { toast } from 'sonner'

export default function TeamDialogs({ member }: { member?: any }) {
    const [openAppModal, setOpenAppModal] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${member.name}? This cannot be undone.`)) return

        setIsDeleting(true)
        const res = await deleteTeamMember(member.id, member.image_url)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success(`${member.name} deleted successfully.`)
        }
        setIsDeleting(false)
    }

    if (!member) {
        // Render Add Button
        return (
            <Dialog open={openAppModal} onOpenChange={setOpenAppModal}>
                <DialogTrigger asChild>
                    <Button>
                        <PlusIcon className="w-4 h-4 mr-2" /> Add Member
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
                    <DialogHeader>
                        <DialogTitle>Add New Team Member</DialogTitle>
                    </DialogHeader>
                    <TeamForm onClose={() => setOpenAppModal(false)} />
                </DialogContent>
            </Dialog>
        )
    }

    // Render Action Buttons (Edit & Delete)
    return (
        <div className="flex items-center gap-2">
            <Dialog open={openAppModal} onOpenChange={setOpenAppModal}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                        <EditIcon className="w-4 h-4 mr-2" /> Edit
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
                    <DialogHeader>
                        <DialogTitle>Edit {member.name}</DialogTitle>
                    </DialogHeader>
                    <TeamForm member={member} onClose={() => setOpenAppModal(false)} />
                </DialogContent>
            </Dialog>

            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting}>
                <TrashIcon className="w-4 h-4" />
            </Button>
        </div>
    )
}
