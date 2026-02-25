import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export async function generateCertificate(
    participantName: string,
    eventName: string,
    date: string,
    templateUrl?: string
) {
    // Create a new PDFDocument or load existing one
    const pdfDoc = await PDFDocument.create()

    // If we had a template URL, we would fetch it and load it:
    // const existingPdfBytes = await fetch(templateUrl).then(res => res.arrayBuffer())
    // const pdfDoc = await PDFDocument.load(existingPdfBytes)

    // For now, create a blank page landscape
    const page = pdfDoc.addPage([842, 595]) // A4 Landscape
    const { width, height } = page.getSize()

    // Embed font
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica)

    // Draw Background (Placeholder)
    page.drawRectangle({
        x: 0,
        y: 0,
        width,
        height,
        color: rgb(0.95, 0.95, 0.95),
    })

    // Draw Border
    page.drawRectangle({
        x: 20,
        y: 20,
        width: width - 40,
        height: height - 40,
        borderColor: rgb(0, 0, 0.5),
        borderWidth: 2,
        color: rgb(1, 1, 1),
    })

    // Draw Title
    page.drawText('CERTIFICATE OF PARTICIPATION', {
        x: width / 2 - 250,
        y: height - 150,
        size: 30,
        font,
        color: rgb(0, 0, 0.5),
    })

    page.drawText('This is to certify that', {
        x: width / 2 - 100,
        y: height - 220,
        size: 20,
        font: regularFont,
        color: rgb(0, 0, 0),
    })

    // Participant Name
    const nameWidth = font.widthOfTextAtSize(participantName, 40)
    page.drawText(participantName, {
        x: (width - nameWidth) / 2,
        y: height - 280,
        size: 40,
        font,
        color: rgb(0.8, 0.2, 0.2), // Red Highlight
    })

    page.drawText(`has successfully participated in the event`, {
        x: width / 2 - 180,
        y: height - 340,
        size: 20,
        font: regularFont,
        color: rgb(0, 0, 0),
    })

    // Event Name
    const eventWidth = font.widthOfTextAtSize(eventName, 30)
    page.drawText(eventName, {
        x: (width - eventWidth) / 2,
        y: height - 390,
        size: 30,
        font,
        color: rgb(0, 0, 0.5),
    })

    // Date
    page.drawText(`Date: ${date}`, {
        x: width / 2 - 80,
        y: height - 450,
        size: 15,
        font: regularFont,
        color: rgb(0.3, 0.3, 0.3),
    })

    const pdfBytes = await pdfDoc.save()
    return pdfBytes
}
