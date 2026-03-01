'use client'

import { useFormStatus } from 'react-dom'
import { Button, buttonVariants } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { VariantProps } from 'class-variance-authority'

export interface SubmitButtonProps extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
    asChild?: boolean;
    pendingText?: string;
}

export function SubmitButton({ children, pendingText, disabled, ...props }: SubmitButtonProps) {
    const { pending } = useFormStatus()

    return (
        <Button
            type="submit"
            disabled={pending || disabled}
            {...props}
        >
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {pending ? (pendingText || children) : children}
        </Button>
    )
}
