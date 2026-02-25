'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { createTestUser } from './actions'
import { toast } from 'sonner'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

const TEST_USERS = [
    { email: 'super_admin@test.com', name: 'Super Admin User', role: 'super_admin' },
    { email: 'event_admin@test.com', name: 'Event Manager', role: 'event_admin' },
    { email: 'finance_admin@test.com', name: 'Finance Officer', role: 'finance_admin' },
    { email: 'content_admin@test.com', name: 'Content Creator', role: 'content_admin' },
    { email: 'moderator@test.com', name: 'Community Mod', role: 'moderator' },
    { email: 'participant@test.com', name: 'Regular Participant', role: 'participant' },
]

export default function SeedPage() {
    const [results, setResults] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    const handleSeed = async () => {
        setLoading(true)
        setResults([])
        const newResults = []

        for (const user of TEST_USERS) {
            try {
                const res = await createTestUser(user.email, user.name, user.role)
                newResults.push(res)
            } catch (e) {
                newResults.push({ success: false, email: user.email, role: user.role, error: 'Failed' })
            }
        }

        setResults(newResults)
        setLoading(false)
        toast.success('Process finished')
    }

    return (
        <div className="container mx-auto py-10 max-w-4xl space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Test User Generator</CardTitle>
                    <CardDescription>Create test accounts for all roles with password: <strong>TestPassword123!</strong></CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Button onClick={handleSeed} disabled={loading} size="lg">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {loading ? 'Creating Users...' : 'Create Test Users'}
                    </Button>

                    <div className="grid gap-4">
                        {results.map((res, i) => (
                            <div key={i} className={`p-4 rounded border flex items-center justify-between ${res.success ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                                <div className="flex items-center gap-3">
                                    {res.success ? <CheckCircle2 className="text-green-600 h-5 w-5" /> : <AlertCircle className="text-yellow-600 h-5 w-5" />}
                                    <div>
                                        <p className="font-medium">{res.email}</p>
                                        <p className="text-sm text-muted-foreground">Role: {res.role}</p>
                                    </div>
                                </div>
                                <div className="text-sm font-medium">
                                    {res.success ? 'Created' : res.error}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-slate-950 text-slate-50 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white">🚀 Final Step: Grant Permissions</CardTitle>
                    <CardDescription className="text-slate-400">
                        Since we are using the public API, these users are created as 'participants' and may require email confirmation.
                        Run the SQL below in your <a href="https://supabase.com/dashboard/project/_/sql" target="_blank" className="underline text-blue-400">Supabase SQL Editor</a> to fix this.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <pre className="bg-slate-900 p-4 rounded overflow-x-auto text-xs font-mono">
                        {`-- CONFIRM EMAILS AND SET ROLES
UPDATE auth.users SET email_confirmed_at = NOW() 
WHERE email IN (
  'super_admin@test.com', 'event_admin@test.com', 
  'finance_admin@test.com', 'content_admin@test.com', 
  'moderator@test.com', 'participant@test.com'
);

UPDATE public.profiles SET role = 'super_admin' WHERE email = 'super_admin@test.com';
UPDATE public.profiles SET role = 'event_admin' WHERE email = 'event_admin@test.com';
UPDATE public.profiles SET role = 'finance_admin' WHERE email = 'finance_admin@test.com';
UPDATE public.profiles SET role = 'content_admin' WHERE email = 'content_admin@test.com';
UPDATE public.profiles SET role = 'moderator' WHERE email = 'moderator@test.com';`}
                    </pre>
                </CardContent>
            </Card>
        </div>
    )
}
