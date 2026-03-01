/**
 * Shared utility for uploading files to Google Drive via the Apps Script proxy.
 */
export async function uploadToGoogleDrive(payload: {
    base64Data: string;
    filename: string;
    mimeType: string;
    eventTitle: string;
    targetFolder: 'Certificates' | 'Payments' | 'Templates' | string;
}) {
    const scriptUrl = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL;

    if (!scriptUrl) {
        console.warn("Google Script URL not found in environment variables. Skipping Drive upload.");
        return null;
    }

    try {
        const response = await fetch(scriptUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Drive script responded with ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (e) {
        console.error("Google Drive upload failed:", e);
        return null;
    }
}
