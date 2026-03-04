import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Github, Linkedin, Twitter, Instagram } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 60 // Revalidate cached team page every 60 seconds

const departments = [
    { title: "Faculty", roles: ["Faculty Head"] },
    { title: "Core Executive Committee", roles: ["Chairman", "Vice Chairman", "Vice President", "Secretary", "Treasurer"] },
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
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-6">Teams</h1>
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
                        const deptRolesWithCompatibility = [...dept.roles];
                        // Add backward compatibility for "Vice President" if "Core Executive Committee"
                        if (dept.title === "Core Executive Committee" && !deptRolesWithCompatibility.includes("Vice President")) {
                            deptRolesWithCompatibility.push("Vice President");
                        }

                        const deptMembers = members
                            .filter(m => deptRolesWithCompatibility.includes(m.role))
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
                                <div className="flex flex-col items-center">
                                    {/* Display Leads (if any exist for this department) */}
                                    {(() => {
                                        const leads = deptMembers.filter((m: any) => m.role.toLowerCase().includes('lead') || m.role.toLowerCase().includes('head') || m.role.toLowerCase().includes('president') || m.role.toLowerCase().includes('chairman'));
                                        const team = deptMembers.filter((m: any) => !leads.includes(m));

                                        // Fallback: If no explicit "lead" title exists, maybe just render everyone in the cluster
                                        const renderMemberCard = (member: any, isLead: boolean = false) => (
                                            <div key={member.id} className={`flex flex-col items-center p-6 transition-all duration-300 ${isLead ? 'scale-110 mb-4' : 'hover:-translate-y-2'}`}>
                                                <div className="relative mb-4">
                                                    <div className="absolute inset-0 bg-blue-500/10 dark:bg-blue-400/10 rounded-full blur-xl scale-150 opacity-0 hover:opacity-100 transition-opacity duration-500" />
                                                    <Avatar className={`border-2 border-slate-200 dark:border-slate-800 shadow-xl relative z-10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm ${isLead ? 'h-32 w-32 md:h-40 md:w-40' : 'h-24 w-24 md:h-32 md:w-32'}`}>
                                                        <AvatarImage src={member.image_url || undefined} className="object-cover" />
                                                        <AvatarFallback className="bg-transparent text-slate-800 dark:text-slate-200 text-xl font-bold">{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                </div>

                                                <div className="text-center">
                                                    <h3 className={`font-extrabold text-slate-900 dark:text-white mb-1 ${isLead ? 'text-2xl' : 'text-xl'}`}>{member.name}</h3>
                                                    <p className="text-blue-600 dark:text-blue-400 font-semibold text-sm mb-3 uppercase tracking-wider">
                                                        {member.role === "Vice President" ? "Vice Chairman" : member.role}
                                                    </p>
                                                    {member.bio && <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto leading-relaxed mb-4">{member.bio}</p>}
                                                </div>

                                                {/* Social Links */}
                                                <div className="flex gap-4 justify-center mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/50 w-full">
                                                    {member.github_url && (
                                                        <Link href={member.github_url} target="_blank" title="GitHub" className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all transform hover:scale-110">
                                                            <Github className="h-6 w-6" />
                                                        </Link>
                                                    )}
                                                    {member.linkedin_url && (
                                                        <Link href={member.linkedin_url} target="_blank" title="LinkedIn" className="text-slate-400 hover:text-[#0077b5] transition-all transform hover:scale-110">
                                                            <Linkedin className="h-6 w-6" />
                                                        </Link>
                                                    )}
                                                    {member.twitter_url && (
                                                        <Link href={member.twitter_url} target="_blank" title="Twitter" className="text-slate-400 hover:text-[#1da1f2] transition-all transform hover:scale-110">
                                                            <Twitter className="h-6 w-6" />
                                                        </Link>
                                                    )}
                                                    {member.instagram_url && (
                                                        <Link href={member.instagram_url} target="_blank" title="Instagram" className="text-slate-400 hover:text-[#e4405f] transition-all transform hover:scale-110">
                                                            <Instagram className="h-6 w-6" />
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        );

                                        return (
                                            <>
                                                {/* Leaders Section */}
                                                {leads.length > 0 && (
                                                    <div className="flex flex-wrap justify-center gap-8 relative z-10 w-full">
                                                        {leads.map((lead: any) => renderMemberCard(lead, true))}
                                                    </div>
                                                )}

                                                {/* Visual Connector Line */}
                                                {leads.length > 0 && team.length > 0 && (
                                                    <div className="relative w-full h-16 flex justify-center items-center my-4 hidden md:flex">
                                                        {/* Vertical Drop */}
                                                        <div className="absolute top-0 w-px h-8 bg-gradient-to-b from-slate-300 to-transparent dark:from-slate-700"></div>
                                                        {/* Horizontal Span (if multiple team members) */}
                                                        {team.length > 1 && (
                                                            <div className="absolute top-8 w-3/4 max-w-3xl h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent"></div>
                                                        )}
                                                        {/* Downward branches */}
                                                        {team.length > 1 && (
                                                            <div className="absolute top-8 w-3/4 max-w-3xl flex justify-between px-[10%]">
                                                                <div className="w-px h-8 bg-gradient-to-b from-slate-300 to-transparent dark:from-slate-700"></div>
                                                                <div className="w-px h-8 bg-gradient-to-b from-slate-300 to-transparent dark:from-slate-700"></div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Team Members Section */}
                                                {team.length > 0 && (
                                                    <div className="flex flex-wrap justify-center gap-x-8 gap-y-12 relative z-10 w-full mt-4 md:mt-0">
                                                        {team.map((member: any) => renderMemberCard(member, false))}
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                            </section>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
