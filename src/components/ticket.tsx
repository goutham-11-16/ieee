'use client'

import { QRCodeCanvas } from 'qrcode.react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Ticket({
    eventTitle,
    date,
    location,
    userName,
    qrCodeValue
}: {
    eventTitle: string,
    date: string,
    location: string,
    userName: string,
    qrCodeValue: string
}) {
    return (
        <Card className="max-w-xs mx-auto border-2 border-dashed border-gray-300 relative overflow-hidden">
            <div className="absolute top-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-500" />
            <CardHeader className="text-center pb-2">
                <CardTitle className="text-lg">{eventTitle}</CardTitle>
                <p className="text-xs text-muted-foreground">{new Date(date).toLocaleDateString()}</p>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
                <div className="bg-white p-2 rounded shadow-sm border">
                    <QRCodeCanvas value={qrCodeValue} size={150} />
                </div>
                <div className="text-center">
                    <p className="text-sm font-semibold">{userName}</p>
                    <p className="text-xs text-muted-foreground">{location}</p>
                </div>
                <div className="text-[10px] text-gray-400">
                    Show this QR code at the entrance
                </div>
            </CardContent>
        </Card>
    )
}
