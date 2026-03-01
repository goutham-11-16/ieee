import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Github, Linkedin, Twitter, Instagram } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 60 // Revalidate cached team page every 60 seconds

const departments = [
    { title: "Faculty", roles: ["Faculty Head"] },
    { title: "Core Executive Committee", roles: ["Chairman", "Vice President", "Secretary", "Treasurer"] },
    { title: "Web Development", roles: ["Web Development Lead", "Web Development Team"] },
    { title: "PR & Outreach", roles: ["PR & Outreach Lead", "PR & Outreach Team"] },
    { title: "Technical Activities", roles: ["Technical Activities Lead", "Technical Activities Team"] },
    { title: "Design & Media", roles: ["Design & Media Lead", "Design & Media Team"] },
    { title: "Event Co-ordinators", roles: ["Event Co-ordinator Team"] },
    { title: "Volunteers", roles: ["Volunteer"] }
]

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
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-6">Our Teams</h1>
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
                <div className="space-y-20">
                    {departments.map(dept => {
                        // Filter members belonging to this department
                        const deptMembers = members
                            .filter(m => dept.roles.includes(m.role))
                            .sort((a, b) => {
                                // Sort by role priority within the department (e.g. Lead before Team)
                                const indexA = dept.roles.indexOf(a.role)
                                const indexB = dept.roles.indexOf(b.role)
                                if (indexA !== indexB) return indexA - indexB

                                // Fallback to display_order
                                return (a.display_order || 0) - (b.display_order || 0)
                            })

                        if (deptMembers.length === 0) return null

                        return (
                            <section key={dept.title} className="mb-12">
                                <h2 className="text-3xl font-bold mb-8 border-b pb-4 text-slate-800 dark:text-slate-200">{dept.title}</h2>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {deptMembers.map((member: any) => (
                                        <Card key={member.id} className="overflow-hidden group hover:shadow-lg transition-all duration-300">
                                            <div className="h-24 bg-gradient-to-r from-blue-500 to-purple-600 opacity-80 group-hover:opacity-100 transition-opacity" />
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
                                                        <Badge variant="secondary" className="mt-2 bg-blue-100/50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">{member.role}</Badge>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                {member.bio && <p className="text-muted-foreground mb-6 text-sm">{member.bio}</p>}
                                                <div className="flex gap-4 text-muted-foreground">
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
                            </section>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
