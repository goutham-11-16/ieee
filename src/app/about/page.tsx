
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AboutPage() {
    return (
        <div className="container mx-auto py-12 px-4 max-w-4xl">
            <div className="text-center mb-16">
                <h1 className="text-4xl font-bold mb-4">About Us</h1>
                <p className="text-xl text-muted-foreground">
                    IEEE Systems, Man, and Cybernetics Society Student Branch Chapter
                </p>
                <p className="text-lg font-semibold text-blue-600 dark:text-blue-400 mt-2">
                    Kalasalingam Academy of Research and Education (KARE)
                </p>
            </div>

            <div className="grid gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Our Mission</CardTitle>
                    </CardHeader>
                    <CardContent className="prose dark:prose-invert max-w-none">
                        <p>
                            To promote the theory, practice, and interdisciplinary aspects of systems science and engineering,
                            human-machine systems, and cybernetics. As a student branch, we aim to bridge the gap between
                            academic learning and industry application in these cutting-edge fields.
                        </p>
                    </CardContent>
                </Card>

                <div className="grid md:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-blue-500">Systems</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                Focusing on systems engineering, large-scale systems, and the integration of complex technologies.
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-purple-500">Human-Machine</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                Emphasizing human factors, ergonomics, and cognitive engineering to improve interaction between humans and technology.
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-emerald-500">Cybernetics</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                Exploring communication and control in machines and living organisms, covering AI, machine learning, and robotics.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>About KARE</CardTitle>
                    </CardHeader>
                    <CardContent className="prose dark:prose-invert max-w-none">
                        <p>
                            Kalasalingam Academy of Research and Education (KARE), formerly Arulmigu Kalasalingam College of Engineering,
                            is situated at Krishnankoil, Tamil Nadu, India. It offers a wide range of undergraduate, postgraduate,
                            and doctoral programs in Engineering, Science, Technology, and Humanities.
                        </p>
                        <p>
                            The IEEE Student Branch at KARE is one of the most active in the region, providing a platform for
                            students to enhance their technical skills and professional network.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
