import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from 'pdf-lib'

interface TableColumn {
    header: string;
    width: number;
    field: string;
}

export async function createReportPDF(title: string, metadata: string[], columns: TableColumn[], data: any[]) {
    const doc = await PDFDocument.create()
    let page = doc.addPage()
    const font = await doc.embedFont(StandardFonts.Helvetica)
    const boldFont = await doc.embedFont(StandardFonts.HelveticaBold)
    const { width, height } = page.getSize()

    let y = height - 50
    const margin = 50
    const rowHeight = 20
    const fontSize = 10

    // Helper to add new page
    const checkPageBreak = () => {
        if (y < 50) {
            page = doc.addPage()
            y = height - 50
            drawHeaders()
        }
    }

    // Draw Header
    page.drawText(title, { x: margin, y, size: 18, font: boldFont })
    y -= 25

    metadata.forEach(line => {
        page.drawText(line, { x: margin, y, size: 10, font })
        y -= 15
    })
    y -= 10 // Spacer

    // Draw Table Headers
    const drawHeaders = () => {
        let x = margin
        columns.forEach(col => {
            page.drawText(col.header, { x, y, size: 10, font: boldFont })
            x += col.width
        })
        y -= 5
        page.drawLine({
            start: { x: margin, y },
            end: { x: width - margin, y },
            thickness: 1,
            color: rgb(0.8, 0.8, 0.8)
        })
        y -= 20
    }

    drawHeaders()

    // Draw Rows
    for (const row of data) {
        checkPageBreak()

        let x = margin
        columns.forEach(col => {
            let text = String(row[col.field] || '')
            // Simple truncation
            const maxWidth = col.width - 5
            if (text.length > maxWidth / 4) {
                text = text.substring(0, Math.floor(maxWidth / 4)) + '...'
            }

            page.drawText(text, { x, y, size: fontSize, font })
            x += col.width
        })

        y -= rowHeight
    }

    // Footer (Simple Page Numbering would require passing pages array, skipping for MVP)

    const pdfBytes = await doc.save()
    return Buffer.from(pdfBytes)
}
