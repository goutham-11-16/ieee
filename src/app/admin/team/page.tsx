import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getTeamMembers } from './actions'
import TeamDialogs from './team-dialogs'

export default async function AdminTeamPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    // Protected: Only super_admin or admin can access (or strictly super_admin based on rules)
    if (!profile || !['super_admin'].includes(profile.role)) {
        return (
            <div className="container mx-auto py-20 text-center">
                <h1 className="text-3xl font-bold text-red-600 mb-4">Access Denied</h1>
                <p className="text-muted-foreground">This page is restricted to Super Admins only.</p>
            </div>
        )
    }

    const members = await getTeamMembers()

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Team Management</h1>
                    <p className="text-muted-foreground">Manage the public /team roster and display order.</p>
                </div>
                <TeamDialogs />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Current Roster</CardTitle>
                    <CardDescription>Members are displayed in ascending order by their Display Order number.</CardDescription>
                </CardHeader>
                <CardContent>
                    {members.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            No team members added yet. Click 'Add Member' to start.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {members.map((member: any) => (
                                <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-16 w-16 shadow-md border">
                                            <AvatarImage src={member.image_url || undefined} className="object-cover" />
                                            <AvatarFallback>{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-lg">{member.name}</h3>
                                                <Badge variant="outline" className="text-xs">Order: {member.display_order}</Badge>
                                            </div>
                                            <p className="text-slate-600 font-medium">{member.role}</p>
                                            <p className="text-sm text-slate-500 line-clamp-1 max-w-lg mt-1">{member.bio}</p>
                                        </div>
                                    </div>
                                    <TeamDialogs member={member} />
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
