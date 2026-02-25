import { getCurrentProfile } from '@/lib/auth'
import { updateProfile } from './actions'
import { createClient } from '@/lib/supabase/server'
import RegistrationList from './registration-list'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default async function ProfilePage() {
    const profile = await getCurrentProfile()

    if (!profile) {
        return <div>Please login to view your profile</div>
    }

    const registrations = await getRegistrations(profile.id)

    const initials = profile.full_name
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase() || 'U'

    return (
        <div className="container mx-auto py-10">
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || 'User')}`} />
                            <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-2xl">Profile Settings</CardTitle>
                            <CardDescription>Manage your account information</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <form action={updateProfile as any} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" value={profile.email} disabled className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input
                                id="fullName"
                                name="fullName"
                                defaultValue={profile.full_name || ''}
                                placeholder="Enter your full name"
                            />
                        </div>
                        <div className="pt-4">
                            <Button type="submit">Save Changes</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <div className="mt-8 max-w-2xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle>My Registrations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <RegistrationList registrations={registrations ?? []} />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

async function getRegistrations(userId: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('registrations')
        .select(`
            id,
            status,
            event:events(title, date, location),
            payment:payments(status, transaction_reference)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

    // Transform data to match component props if necessary, 
    // but the select structure should match mostly.
    // Supabase returns arrays for joined relations sometimes if not 1:1, 
    // but payments is 1:many (registration:payment)? No 1:many payments:registration.
    // My schema: payments.registration_id -> registrations.id. 
    // So distinct registration has 0 or 1 payment usually (or retry).
    // Let's assume single payment for simplicity or map the first one.

    return data?.map(reg => ({
        ...reg,
        event: Array.isArray(reg.event) ? reg.event[0] : reg.event,
        payment: Array.isArray(reg.payment) ? reg.payment[0] : reg.payment
    }))
}
