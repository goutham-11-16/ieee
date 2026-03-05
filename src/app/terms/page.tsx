'use client'

import { ScrollReveal } from '@/components/ui/scroll-reveal'

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 font-sans pt-24 md:pt-36 px-4">
            <div className="container mx-auto max-w-4xl">
                <ScrollReveal>
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 md:p-14 shadow-xl border border-slate-200/50 dark:border-slate-800">
                        <div className="mb-12">
                            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6">
                                Terms & Conditions
                            </h1>
                            <div className="h-1.5 w-20 bg-emerald-600 dark:bg-emerald-500 rounded-full mb-6"></div>
                            <p className="text-slate-500 dark:text-slate-400">Last updated: {new Date().toLocaleDateString()}</p>
                        </div>

                        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
                            <section>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">1. Agreement to Terms</h2>
                                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-justify">
                                    By accessing this website and registering for events hosted by the IEEE Systems, Man, and Cybernetics Society Student Branch
                                    Chapter at Kalasalingam Academy of Research and Education, you agree to be bound by these Terms and Conditions and agree that
                                    you are responsible for compliance with any applicable local laws.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">2. Event Registration & Payments</h2>
                                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-justify mb-4">
                                    When registering for any event, you agree to provide accurate and complete information. If a payment is required:
                                </p>
                                <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-300">
                                    <li>You must complete the transaction within the specified time window (usually 5 minutes).</li>
                                    <li>If you fail to submit payment proof within the allotted time, your reserved seat will be forfeited.</li>
                                    <li>All submitted payment screenshots are subject to manual verification by our finance team before tickets are officially issued.</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">3. Code of Conduct</h2>
                                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-justify">
                                    Attendees of our events are expected to behave professionally and respectfully. Harassment, discrimination, or disruptive
                                    behavior will not be tolerated and may result in immediate removal from the event without refund, and potential banning from
                                    future IEEE SMC activities.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">4. Certificates</h2>
                                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-justify">
                                    Certificates of participation or achievement are issued at the discretion of the chapter hierarchy. The chapter reserves
                                    the right to withhold certificates from individuals who fail to attend the mandated duration of the event or violate the code of conduct.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">5. Disclaimer</h2>
                                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-justify">
                                    The materials on this website are provided on an 'as is' basis. IEEE SMC KARE makes no warranties, expressed or implied,
                                    and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of
                                    merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
                                </p>
                            </section>
                        </div>
                    </div>
                </ScrollReveal>
            </div>
        </div>
    )
}
