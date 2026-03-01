import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { CheckCircleIcon, XCircleIcon, DownloadIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function VerifyCertificatePage(props: { params: Promise<{ code: string }> }) {
    const params = await props.params
    const supabase = await createClient()

    const { data: cert } = await supabase
        .from('certificates')
        .select(`
            unique_code,
            created_at,
            registration:registrations (
                user:profiles!user_id(full_name),
                event:events(title, date)
            ),
            file_url
        `)
        .eq('unique_code', params.code)
        .single()

    if (!cert) {
        return (
            <div className="container mx-auto py-20 flex justify-center">
                <Card className="border-red-500 bg-red-50 w-full max-w-md">
                    <CardHeader className="text-center">
                        <XCircleIcon className="w-16 h-16 text-red-600 mx-auto mb-4" />
                        <CardTitle className="text-red-700">Invalid Certificate</CardTitle>
                        <CardDescription>
                            The certificate code <strong>{params.code}</strong> could not be found.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from('certificates')
        .getPublicUrl(cert.file_url)

    // Cast for type safety
    interface CertificateDetails {
        unique_code: string;
        created_at: string;
        file_url: string;
        registration: {
            user: { full_name: string };
            event: { title: string; date: string };
        };
    }
    const certificate = cert as unknown as CertificateDetails;

    return (
        <div className="container mx-auto py-20 flex justify-center">
            <Card className="border-green-500 bg-green-50 dark:bg-green-900/10 w-full max-w-md">
                <CardHeader className="text-center">
                    <CheckCircleIcon className="w-16 h-16 text-green-600 mx-auto mb-4" />
                    <CardTitle className="text-green-700 dark:text-green-400">Valid Certificate</CardTitle>
                    <CardDescription>
                        This certificate is authentic.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-center">
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Issued To</p>
                        <p className="text-xl font-bold">{certificate.registration.user.full_name}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Event</p>
                        <p className="font-medium">{certificate.registration.event.title}</p>
                        <p className="text-sm text-muted-foreground">{new Date(certificate.registration.event.date).toLocaleDateString('en-GB')}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Certificate ID</p>
                        <p className="font-mono bg-white dark:bg-black/20 inline-block px-2 py-1 rounded">{certificate.unique_code}</p>
                    </div>
                </CardContent>
                <CardFooter className="justify-center">
                    <Button asChild>
                        <a href={publicUrl} target="_blank">
                            <DownloadIcon className="mr-2 w-4 h-4" /> Download PDF
                        </a>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
