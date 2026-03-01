import Link from 'next/link'
import { Facebook, Twitter, Instagram, Linkedin, Mail, MapPin, Phone } from 'lucide-react'

export function SiteFooter() {
    return (
        <footer className="bg-slate-50 dark:bg-slate-900 border-t pt-16 pb-8">
            <div className="container px-4 mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <img
                                src="https://i.ibb.co/yFsM0hzC/Gemini-Generated-Image-lb3h34lb3h34lb3h.png"
                                alt="IEEE SMC KARE Logo"
                                className="h-16 w-auto object-contain bg-white rounded-lg p-1 shadow-sm"
                            />
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400">IEEE SMC - KARE</span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-xs">
                            Promoting systems science, engineering, and cybernetics. Empowering students through technical excellence and community leadership.
                        </p>
                        <div className="flex items-center gap-4">
                            <Link href="#" className="p-2 rounded-full bg-white dark:bg-slate-800 shadow-sm hover:shadow-md hover:text-blue-600 transition-all">
                                <Facebook className="w-4 h-4" />
                            </Link>
                            <Link href="#" className="p-2 rounded-full bg-white dark:bg-slate-800 shadow-sm hover:shadow-md hover:text-blue-400 transition-all">
                                <Twitter className="w-4 h-4" />
                            </Link>
                            <Link href="#" className="p-2 rounded-full bg-white dark:bg-slate-800 shadow-sm hover:shadow-md hover:text-pink-600 transition-all">
                                <Instagram className="w-4 h-4" />
                            </Link>
                            <Link href="#" className="p-2 rounded-full bg-white dark:bg-slate-800 shadow-sm hover:shadow-md hover:text-blue-700 transition-all">
                                <Linkedin className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white mb-6">Quick Exploration</h3>
                        <ul className="space-y-4">
                            <li><Link href="/events" className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm">Upcoming Events</Link></li>
                            <li><Link href="/about" className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm">About Chapter</Link></li>
                            <li><Link href="/team" className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm">Our Teams</Link></li>
                            <li><Link href="/contact" className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm">Get in Touch</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white mb-6">Resources</h3>
                        <ul className="space-y-4">
                            <li><Link href="/status" className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm">Status Checker</Link></li>
                            <li><Link href="#" className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm">Download Guidelines</Link></li>
                            <li><Link href="#" className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm">Privacy Policy</Link></li>
                            <li><Link href="#" className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm">Terms & Conditions</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white mb-6">Contact Info</h3>
                        <ul className="space-y-4">
                            <li className="flex gap-3 text-sm text-slate-500 dark:text-slate-400">
                                <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                <span>Kalasalingam Academy of Research and Education, Krishnankoil, Tamil Nadu</span>
                            </li>
                            <li className="flex gap-3 text-sm text-slate-500 dark:text-slate-400">
                                <Phone className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                <span>+91 12345 67890</span>
                            </li>
                            <li className="flex gap-3 text-sm text-slate-500 dark:text-slate-400">
                                <Mail className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                <span>ieeesmc@klu.ac.in</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left text-slate-400 text-xs">
                    <p>© {new Date().getFullYear()} IEEE SMC Student Branch - KARE. All rights reserved.</p>
                    <div className="flex gap-6">
                        <Link href="#" className="hover:text-slate-600 dark:hover:text-slate-200 transition-colors">IEEE.org</Link>
                        <Link href="#" className="hover:text-slate-600 dark:hover:text-slate-200 transition-colors">IEEE Xplore</Link>
                        <Link href="#" className="hover:text-slate-600 dark:hover:text-slate-200 transition-colors">Standards</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
