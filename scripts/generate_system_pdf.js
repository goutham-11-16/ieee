const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function createFlowPDF() {
    console.log('Starting PDF generation...');
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const pdfPage = pdfDoc.addPage([600, 800]);
    const { width, height } = pdfPage.getSize();
    let yPos = height - 50;

    const drawTitle = (text) => {
        pdfPage.drawText(text, { x: 50, y: yPos, size: 22, font: boldFont, color: rgb(0.1, 0.3, 0.6) });
        yPos -= 40;
    };

    const drawHeading = (text) => {
        pdfPage.drawText(text, { x: 50, y: yPos, size: 15, font: boldFont, color: rgb(0, 0, 0) });
        yPos -= 25;
    };

    const drawText = (text) => {
        const lines = text.split('\n');
        for (const line of lines) {
            pdfPage.drawText(line, { x: 60, y: yPos, size: 11, font: font, color: rgb(0.2, 0.2, 0.2) });
            yPos -= 18;
        }
    };

    drawTitle('IEEE Club Event Management System');
    pdfPage.drawText('Detailed Workflow & Architecture Overview', { x: 50, y: yPos + 10, size: 14, font: font, color: rgb(0.4, 0.4, 0.4) });
    yPos -= 40;

    drawHeading('1. Event Administration & Governance');
    drawText('- Admin creates event: Title, Fees, Start/End Dates, Capacity.\n- All events are queued for Super Admin Approval.\n- Approved events are published to the public list automatically.');

    yPos -= 20;
    drawHeading('2. Registration & Intelligent Gating');
    drawText('- Users/Guests register with validation (Uniqueness check per event).\n- Fee-based events move to "Pending Payment".\n- Free events move directly to "Approved" with Ticket generation.');

    yPos -= 20;
    drawHeading('3. Secure Payment Lifecycle');
    drawText('- Participants upload proof of payment via mobile/desktop.\n- Finance Admins review proofs in a dedicated terminal.\n- System transitions Reference IDs (TEMP to KARE) upon verification.');

    yPos -= 20;
    drawHeading('4. Real-time Attendance (QR)');
    drawText('- Each approved participant receives a permanent QR Code Ticket.\n- Admins use the "Scan & Mark" tool at venue checkpoints.\n- Verification ensures correct event, status, and single-use logic.');

    yPos -= 20;
    drawHeading('5. Certificate Issuance & Cloud Storage');
    drawText('- Admins design high-res certificate templates visually.\n- Batch generation processes only "Attended & Approved" users.\n- PDFs are securely synced to Google Drive and Supabase Storage.');

    yPos -= 40;
    pdfPage.drawText('This document provides a summary of the system logic as of March 2026.', { x: 50, y: yPos, size: 9, font: font, color: rgb(0.6, 0.6, 0.6) });

    const pdfBytes = await pdfDoc.save();
    const outputPath = path.join(process.cwd(), 'System_Workflow_Overview.pdf');
    fs.writeFileSync(outputPath, pdfBytes);
    console.log('PDF Generated Successfully at: ' + outputPath);
}

createFlowPDF().catch(err => {
    console.error('PDF Generation Failed:', err);
    process.exit(1);
});
