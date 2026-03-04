'use client'

import { useState, useEffect } from 'react'

export function ScrollProgress() {
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        const handleScroll = () => {
            const winScroll = document.documentElement.scrollTop || document.body.scrollTop
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight
            let scrolled = (winScroll / height) * 100

            // Clamp between 0 and 100 to prevent "dancing" on elastic scroll devices (like iOS)
            if (scrolled < 0) scrolled = 0
            if (scrolled > 100) scrolled = 100

            setProgress(scrolled)
        }

        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <div className="fixed top-0 left-0 right-0 h-1 z-[100] bg-transparent pointer-events-none hidden md:block">
            <div
                className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-150 ease-out"
                style={{ width: `${progress}%` }}
            />
        </div>
    )
}
