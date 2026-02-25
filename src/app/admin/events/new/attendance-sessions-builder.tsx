'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PlusIcon, TrashIcon } from 'lucide-react'

export interface AttendanceSession {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
}

interface Props {
    initialSessions?: AttendanceSession[];
}

export function AttendanceSessionsBuilder({ initialSessions = [] }: Props) {
    const [sessions, setSessions] = useState<AttendanceSession[]>(initialSessions)

    const addSession = () => {
        setSessions([...sessions, {
            id: crypto.randomUUID(),
            name: '',
            startTime: '',
            endTime: ''
        }])
    }

    const removeSession = (id: string) => {
        setSessions(sessions.filter(s => s.id !== id))
    }

    const updateSession = (id: string, field: keyof AttendanceSession, value: string) => {
        setSessions(sessions.map(s => s.id === id ? { ...s, [field]: value } : s))
    }

    return (
        <div className="space-y-4 border p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50">
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h3 className="text-lg font-medium">Attendance Sessions</h3>
                    <p className="text-sm text-muted-foreground">Define different check-in sessions (e.g. Day 1 Morning, Day 2 Afternoon). Leave empty for a single default session.</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addSession}>
                    <PlusIcon className="w-4 h-4 mr-2" /> Add Session
                </Button>
            </div>

            {sessions.map((session, index) => (
                <div key={session.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded bg-background items-end">
                    <div className="space-y-2 md:col-span-2">
                        <Label>Session Name</Label>
                        <Input
                            value={session.name}
                            placeholder="e.g. Morning Keynote"
                            onChange={(e) => updateSession(session.id, 'name', e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Start Time</Label>
                        <Input
                            type="time"
                            value={session.startTime}
                            onChange={(e) => updateSession(session.id, 'startTime', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>End Time</Label>
                        <div className="flex gap-2">
                            <Input
                                type="time"
                                value={session.endTime}
                                onChange={(e) => updateSession(session.id, 'endTime', e.target.value)}
                            />
                            <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeSession(session.id)}>
                                <TrashIcon className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            ))}

            <input type="hidden" name="attendanceSessions" value={JSON.stringify(sessions)} />
        </div>
    )
}
