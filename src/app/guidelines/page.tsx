'use client'

import { ScrollReveal } from '@/components/ui/scroll-reveal'
import { Download, ShieldCheck, Mail, CheckCircle2 } from 'lucide-react'

export default function GuidelinesPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 font-sans pt-24 md:pt-36 px-4">
            <div className="container mx-auto max-w-4xl">
                <ScrollReveal>
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 md:p-14 shadow-xl border border-slate-200/50 dark:border-slate-800">
                        <div className="mb-12">
                            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6">
                                Download Guidelines
                            </h1>
                            <div className="h-1.5 w-20 bg-indigo-600 dark:bg-indigo-500 rounded-full mb-6"></div>
                            <p className="text-slate-500 dark:text-slate-400">
                                Step-by-step instructions for retrieving your IEEE SMC event participation certificates.
                            </p>
                        </div>

                        <div className="space-y-12">
                            {/* Step 1 */}
                            <div className="flex gap-6 items-start">
                                <div className="hidden sm:flex flex-shrink-0 w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-2xl items-center justify-center font-bold text-xl">
                                    1
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold flex items-center gap-2 mb-3 text-slate-900 dark:text-white">
                                        <span className="sm:hidden w-8 h-8 flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg text-sm mr-2">1</span>
                                        <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                                        Verify Your Status
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                        Navigate to the <strong>Status Checker</strong> page from the homepage menu. This is the central hub where you can view your registration status.
                                        You will need to search using the email address or registration number you used during the event signup.
                                    </p>
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="flex gap-6 items-start">
                                <div className="hidden sm:flex flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-2xl items-center justify-center font-bold text-xl">
                                    2
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold flex items-center gap-2 mb-3 text-slate-900 dark:text-white">
                                        <span className="sm:hidden w-8 h-8 flex items-center justify-center bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg text-sm mr-2">2</span>
                                        <ShieldCheck className="w-5 h-5 text-blue-500" />
                                        Check Finance Approval
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                        Once you locate your registration, verify that your payment status is marked as <strong>Approved</strong>. Our finance team
                                        manually reviews all payment screenshots, so please allow up to 24 hours after the event for your status to be updated. Certificates are
                                        only dynamically generated for attendees with cleared payments.
                                    </p>
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className="flex gap-6 items-start">
                                <div className="hidden sm:flex flex-shrink-0 w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-2xl items-center justify-center font-bold text-xl">
                                    3
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold flex items-center gap-2 mb-3 text-slate-900 dark:text-white">
                                        <span className="sm:hidden w-8 h-8 flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm mr-2">3</span>
                                        <Download className="w-5 h-5 text-emerald-500" />
                                        Generate and Download
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                        If your registration is approved and the event certificates have been released, you will see a <span className="text-emerald-600 font-semibold px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-md">Download Certificate</span> button associated with your ticket.
                                        Clicking this button will dynamically render your personalized high-resolution PDF certificate directly in your browser.
                                    </p>
                                </div>
                            </div>

                            {/* Step 4 */}
                            <div className="flex gap-6 items-start">
                                <div className="hidden sm:flex flex-shrink-0 w-12 h-12 bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 rounded-2xl items-center justify-center font-bold text-xl">
                                    4
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold flex items-center gap-2 mb-3 text-slate-900 dark:text-white">
                                        <span className="sm:hidden w-8 h-8 flex items-center justify-center bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 rounded-lg text-sm mr-2">4</span>
                                        <Mail className="w-5 h-5 text-rose-500" />
                                        Troubleshooting
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                        If you attended the event and your payment was approved, but there is an error in your name spelling or the download button is missing after
                                        certificates have been officially announced, please contact our support team at <a href="mailto:kareieeesmc@gmail.com" className="text-rose-600 hover:underline">kareieeesmc@gmail.com</a> with your registration ID.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </ScrollReveal>
            </div>
        </div>
    )
}
