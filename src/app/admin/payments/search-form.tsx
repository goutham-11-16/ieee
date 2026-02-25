'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SearchIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function PaymentSearchForm() {
    const router = useRouter()

    return (
        <form onSubmit={(e) => {
            e.preventDefault()
            const ref = new FormData(e.currentTarget).get('ref') as string
            if (ref) router.push(`/admin/payments?ref=${ref}`)
        }} className="flex gap-4">
            <Input name="ref" placeholder="Enter Reference Number (e.g. KARE-A1B2C3D4)" className="flex-1" required />
            <Button type="submit">
                <SearchIcon className="w-4 h-4 mr-2" /> Search
            </Button>
        </form>
    )
}
