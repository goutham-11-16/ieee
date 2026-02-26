"use client"

import { useEffect, useState } from "react"
import confetti from "canvas-confetti"
import { useSearchParams } from "next/navigation"

export function SuccessConfetti() {
    const searchParams = useSearchParams()
    const isNew = searchParams.get('new') === '1'
    const [hasFired, setHasFired] = useState(false)

    useEffect(() => {
        if (isNew && !hasFired) {
            // Give the UI a brief moment to paint before firing the blast
            const timeout = setTimeout(() => {
                const duration = 3 * 1000;
                const animationEnd = Date.now() + duration;
                const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

                const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

                const interval: any = setInterval(function () {
                    const timeLeft = animationEnd - Date.now();

                    if (timeLeft <= 0) {
                        return clearInterval(interval);
                    }

                    const particleCount = 50 * (timeLeft / duration);
                    // since particles fall down, start a bit higher than random
                    confetti({
                        ...defaults, particleCount,
                        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
                        colors: ['#2563eb', '#10b981', '#ffffff'] // Blue, Emerald, White
                    });
                    confetti({
                        ...defaults, particleCount,
                        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
                        colors: ['#2563eb', '#10b981', '#ffffff']
                    });
                }, 250);

                setHasFired(true)
            }, 300)

            return () => clearTimeout(timeout)
        }
    }, [isNew, hasFired])

    return null // This component doesn't render anything visually
}
