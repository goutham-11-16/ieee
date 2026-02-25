import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Github, Linkedin, Twitter, Instagram } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 60 // Revalidate cached team page every 60 seconds

export default async function TeamPage() {
    const supabase = await createClient()

    const { data: teamMembers, error } = await supabase
        .from('team_profiles')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true })

    const members = error ? [] : teamMembers || []

    return (
        <div className="container mx-auto py-12 px-4">
            <section className="text-center mb-16">
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-6">Meet the IEEE SMC KARE Team</h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    The passionate individuals driving the Systems, Man, and Cybernetics community at Kalasalingam University.
                </p>
            </section>

            {members.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground bg-slate-50 dark:bg-slate-900 rounded-xl max-w-2xl mx-auto border border-slate-200 dark:border-slate-800">
                    <p className="text-lg">The team roster is currently being updated.</p>
                    <p className="text-sm mt-2">Check back soon to see our amazing team members!</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {members.map((member: any) => (
                        <Card key={member.id} className="overflow-hidden group hover:shadow-lg transition-all duration-300">
                            <div className="h-24 bg-gradient-to-r from-blue-500 to-purple-600 opacity-80" />
                            <div className="px-6 -mt-12">
                                <Avatar className="h-24 w-24 border-4 border-white dark:border-slate-950 shadow-md">
                                    <AvatarImage src={member.image_url || undefined} className="object-cover" />
                                    <AvatarFallback>{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                            </div>
                            <CardHeader className="pt-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-xl">{member.name}</CardTitle>
                                        <Badge variant="secondary" className="mt-1">{member.role}</Badge>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground mb-6 text-sm">{member.bio}</p>
                                <div className="flex gap-3 text-muted-foreground">
                                    {member.github_url && (
                                        <Link href={member.github_url} target="_blank" className="hover:text-black dark:hover:text-white transition-colors">
                                            <Github className="h-5 w-5" />
                                        </Link>
                                    )}
                                    {member.linkedin_url && (
                                        <Link href={member.linkedin_url} target="_blank" className="hover:text-blue-700 transition-colors">
                                            <Linkedin className="h-5 w-5" />
                                        </Link>
                                    )}
                                    {member.twitter_url && (
                                        <Link href={member.twitter_url} target="_blank" className="hover:text-blue-400 transition-colors">
                                            <Twitter className="h-5 w-5" />
                                        </Link>
                                    )}
                                    {member.instagram_url && (
                                        <Link href={member.instagram_url} target="_blank" className="hover:text-pink-600 transition-colors">
                                            <Instagram className="h-5 w-5" />
                                        </Link>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
