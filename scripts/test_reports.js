require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const { jsPDF } = require("jspdf");
const autoTable = require("jspdf-autotable").default;

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testPdf() {
    console.log("Fetching registrations...");
    const { data: registrations, error } = await s
        .from('registrations')
        .select(`
            status,
            reference_number,
            guest_name,
            guest_email,
            guest_phone,
            guest_reg_no,
            team_members,
            user:profiles!user_id(full_name, email),
            created_at,
            payments(amount, transaction_ref, proof_url, status),
            attendance(session_name, check_in_time)
        `)
        .eq('event_id', 'e305e60e-43d9-4b67-8ccb-cf57eab7993a')
        .in('status', ['approved', 'pending_approval', 'pending_payment']);

    if (error) {
        console.error("Fetch error:", error);
        return;
    }

    console.log(`Found ${registrations.length} leads.`);

    const doc = new jsPDF();

    doc.setFontSize(20)
    doc.text("Test Report PDF", 14, 22)
    doc.setFontSize(11)

    const columns = [
        { header: 'Ref No', dataKey: 'refNo' },
        { header: 'Name', dataKey: 'name' },
        { header: 'Status', dataKey: 'status' },
        { header: 'Type', dataKey: 'type' },
    ];

    const rowData = [];
    let totalHumans = 0;
    let totalLeads = 0;

    registrations.forEach(r => {
        const u = r.user;
        const leaderName = r.guest_name || u?.full_name || 'N/A';

        totalLeads++;
        totalHumans++;

        const row = {
            refNo: r.reference_number || '-',
            name: leaderName,
            status: r.status,
            type: 'Primary',
        };

        rowData.push(row);

        const teamMembers = Array.isArray(r.team_members) ? r.team_members : [];
        teamMembers.forEach(m => {
            if (m.guestName) {
                totalHumans++;
                const memberRow = {
                    refNo: '-',
                    name: `  • ${m.guestName}`,
                    status: '-',
                    type: 'Team Member'
                };
                rowData.push(memberRow);
            }
        });

        if (teamMembers.filter(m => m.guestName).length > 0) {
            rowData.push({
                refNo: '', name: '', status: '', type: ''
            });
        }
    });

    doc.text(`Total Regs: ${totalLeads} | Total Participants: ${totalHumans}`, 14, 30)

    autoTable(doc, {
        startY: 35,
        columns: columns,
        body: rowData,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [41, 128, 185] }
    });

    const pdfData = doc.output();
    fs.writeFileSync('./test_report.pdf', pdfData, 'binary');
    console.log("Wrote test_report.pdf");
}

testPdf();
