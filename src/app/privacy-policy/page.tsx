'use client'

import { ScrollReveal } from '@/components/ui/scroll-reveal'

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 font-sans pt-24 md:pt-36 px-4">
            <div className="container mx-auto max-w-4xl">
                <ScrollReveal>
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 md:p-14 shadow-xl border border-slate-200/50 dark:border-slate-800">
                        <div className="mb-12">
                            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6">
                                Privacy Policy
                            </h1>
                            <div className="h-1.5 w-20 bg-blue-600 dark:bg-blue-500 rounded-full mb-6"></div>
                            <p className="text-slate-500 dark:text-slate-400">Last updated: {new Date().toLocaleDateString()}</p>
                        </div>

                        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
                            <section>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">1. Introduction</h2>
                                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-justify">
                                    Welcome to the IEEE Systems, Man, and Cybernetics Society Student Branch Chapter at Kalasalingam Academy of Research and Education.
                                    We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we look after
                                    your personal data when you visit our website, register for our events, or interact with our chapter.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">2. The Data We Collect</h2>
                                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-justify mb-4">
                                    We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
                                </p>
                                <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-300">
                                    <li><strong>Identity Data:</strong> includes first name, last name, and registration number.</li>
                                    <li><strong>Contact Data:</strong> includes email address and telephone numbers.</li>
                                    <li><strong>Technical Data:</strong> includes internet protocol (IP) address, browser type and version, time zone setting and location.</li>
                                    <li><strong>Registration Data:</strong> details about events you have registered for and payment screenshots for verification purposes.</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">3. How We Use Your Data</h2>
                                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-justify">
                                    We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
                                    To register you as a new event attendee, to manage our relationship with you, to administer and protect our website, and to deliver
                                    relevant event updates and certificates to you.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">4. Data Security</h2>
                                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-justify">
                                    We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an
                                    unauthorized way, altered, or disclosed. Access to your personal data is limited to those executive members who have a legitimate need to know.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">5. Contact Us</h2>
                                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-justify">
                                    If you have any questions about this privacy policy or our privacy practices, please contact us at
                                    <a href="mailto:kareieeesmc@gmail.com" className="text-blue-600 dark:text-blue-400 hover:underline ml-1">kareieeesmc@gmail.com</a>.
                                </p>
                            </section>
                        </div>
                    </div>
                </ScrollReveal>
            </div>
        </div>
    )
}
