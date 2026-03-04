import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Mail, MapPin, Phone, Linkedin, Instagram } from 'lucide-react'
import Link from 'next/link'

export default function ContactPage() {
    return (
        <div className="container mx-auto py-12 px-4">
            <section className="text-center mb-16">
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-6">Contact Us</h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Have questions or want to partner with us? Reach out!
                </p>
            </section>

            <div className="max-w-xl mx-auto">
                <Card>
                    <CardHeader className="text-center">
                        <CardTitle>Get in Touch</CardTitle>
                        <CardDescription>We'd love to hear from you.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-4">
                        <div className="flex items-start space-x-4">
                            <MapPin className="h-6 w-6 text-blue-600 mt-1" />
                            <div>
                                <h3 className="font-semibold">Visit Us</h3>
                                <p className="text-muted-foreground">
                                    IEEE SMC Student Branch<br />
                                    Kalasalingam Academy of Research and Education<br />
                                    Krishnankoil, Tamil Nadu 626126
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-4">
                            <Linkedin className="h-6 w-6 text-blue-700 mt-1" />
                            <div>
                                <h3 className="font-semibold">LinkedIn</h3>
                                <Link
                                    href="https://www.linkedin.com/company/kare-ieee-smc-society/"
                                    target="_blank"
                                    className="text-blue-600 hover:underline text-sm"
                                >
                                    linkedin.com/company/kare-ieee-smc-society
                                </Link>
                            </div>
                        </div>

                        <div className="flex items-start space-x-4">
                            <Instagram className="h-6 w-6 text-pink-600 mt-1" />
                            <div>
                                <h3 className="font-semibold">Instagram</h3>
                                <Link
                                    href="https://www.instagram.com/ieeesmc_kare?igsh=cTlnaGgyY2k0NXNu"
                                    target="_blank"
                                    className="text-pink-600 hover:underline text-sm"
                                >
                                    @ieeesmc_kare
                                </Link>
                            </div>
                        </div>

                        <div className="flex items-start space-x-4">
                            <Mail className="h-6 w-6 text-blue-600 mt-1" />
                            <div>
                                <h3 className="font-semibold">Email</h3>
                                <div className="space-y-1">
                                    <a href="mailto:kareieeesmc@gmail.com" className="text-muted-foreground hover:text-blue-600 block text-sm">
                                        kareieeesmc@gmail.com
                                    </a>
                                    <a href="mailto:ieeesmc@klu.ac.in" className="text-muted-foreground hover:text-blue-600 block text-sm italic opacity-70">
                                        ieeesmc@klu.ac.in (Alternative)
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start space-x-4">
                            <Phone className="h-6 w-6 text-blue-600 mt-1" />
                            <div>
                                <h3 className="font-semibold">Call Us</h3>
                                <p className="text-muted-foreground">+91 9281401356</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
