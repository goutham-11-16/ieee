import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import autoTable from 'jspdf-autotable'

try {
    const doc = new jsPDF()
    const title = "Test Report"

    doc.setFontSize(20)
    doc.text(title, 14, 22)

    let head = [['Name', 'Email']]
    let body = [['John Doe', 'john@example.com']]

    console.log("Testing doc.autoTable (old style)...")
    try {
        // @ts-ignore
        doc.autoTable({
            startY: 40,
            head,
            body,
            styles: { fontSize: 9 },
            headStyles: { fillColor: [41, 128, 185] }
        })
        console.log("doc.autoTable worked.")
    } catch (e) {
        console.error("doc.autoTable failed:", e)
    }

    console.log("Testing autoTable(doc) (new style)...")
    try {
        autoTable(doc, {
            startY: 40,
            head,
            body,
            styles: { fontSize: 9 },
            headStyles: { fillColor: [41, 128, 185] }
        })
        console.log("autoTable(doc) worked.")
    } catch (e) {
        console.error("autoTable(doc) failed:", e)
    }

    const pdfOutput = doc.output('arraybuffer')
    console.log("PDF ArrayBuffer length:", pdfOutput.byteLength)

} catch (e) {
    console.error("Fatal PDF Error:", e)
}
