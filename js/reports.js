// 1. Show Reports Screen
function showReportsScreen() {
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
    document.getElementById('reports-screen').classList.add('active');
    
    document.getElementById('report-filter').value = "approved";
    renderReportsTable();
}

// 2. Hide Reports Screen (Go Back)
function hideReportsScreen() {
    document.getElementById('reports-screen').classList.remove('active');
    const user = JSON.parse(sessionStorage.getItem("currentUser"));
    
    if (user.role === 'technician') {
        document.getElementById('tech-dashboard').classList.add('active');
    } else {
        document.getElementById('incharge-dashboard').classList.add('active');
    }
}

// 3. Render the Reports Table (On-Screen)
function renderReportsTable() {
    const filter = document.getElementById('report-filter').value;
    const tbody = document.getElementById('reports-tbody');
    tbody.innerHTML = '';
    
    let allRecords = JSON.parse(localStorage.getItem('pmRecords')) || [];
    
    // Filter logic
    let filteredRecords = allRecords;
    if (filter !== 'all') {
        filteredRecords = allRecords.filter(r => r.status === filter);
    }
    
    // Sort by date (newest first)
    filteredRecords.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    if (filteredRecords.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; color:#777;">No records found for this filter.</td></tr>';
        return;
    }

    filteredRecords.forEach((record, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${record.tag}</strong></td>
            <td>${record.dept}</td>
            <td>${record.location}</td>
            <td>${record.type}</td>
            <td>${record.brand}</td>
            <td>${record.model}</td>
            <td>${record.serial}</td>
            <td>${record.date}</td>
            <td>${record.technicianName}</td>
        `;
        tbody.appendChild(tr);
    });
}

// 4. Export to CSV (Excel)
function exportToCSV() {
    let allRecords = JSON.parse(localStorage.getItem('pmRecords')) || [];
    const filter = document.getElementById('report-filter').value;
    
    if (filter !== 'all') {
        allRecords = allRecords.filter(r => r.status === filter);
    }
    
    if (allRecords.length === 0) {
        alert("No data to export.");
        return;
    }

    const headers = ["No.", "Tag Number", "Department/Service", "Location", "AC Type", "Brand", "Model", "Serial Number", "PM Date", "Technician", "Status", "Approved By"];
    
    const rows = allRecords.map((record, index) => {
        return [
            index + 1,
            `"${record.tag}"`,
            `"${record.dept}"`,
            `"${record.location}"`,
            `"${record.type}"`,
            `"${record.brand}"`,
            `"${record.model}"`,
            `"${record.serial}"`,
            record.date,
            `"${record.technicianName}"`,
            record.status,
            `"${record.approvedBy || ''}"`
        ].join(",");
    });

    const csvContent = headers.join(",") + "\n" + rows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `CHUB_AC_PM_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 5. Generate Smart PDF (The Official CHUB Format)
function generateSmartPDF() {
    // Filter to ONLY include approved records for the official report
    let allRecords = JSON.parse(localStorage.getItem('pmRecords')) || [];
    const approvedRecords = allRecords.filter(r => r.status === "approved");

    if (approvedRecords.length === 0) {
        alert("No approved records found to generate the report.");
        return;
    }

    // Initialize jsPDF in Landscape mode
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4'); // 'l' = landscape, 'mm' = millimeters, 'a4' = paper size

    // --- 1. Document Header ---
    doc.setFontSize(18);
    doc.setTextColor(0, 86, 179); // CHUB Blue
    doc.text("CHUB Hospital - Air Conditioner Preventive Maintenance Report", 14, 15);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated Date: ${new Date().toLocaleDateString()}`, 14, 22);
    doc.text(`Total Units Serviced: ${approvedRecords.length}`, 14, 27);

    // --- 2. Build Table Data ---
    const tableColumn = ["No.", "Tag Number", "Department/Service", "Location", "AC Type", "Brand", "Model", "Serial Number", "PM Date", "Technician"];
    const tableRows = [];

    approvedRecords.forEach((record, index) => {
        const rowData = [
            index + 1,
            record.tag,
            record.dept,
            record.location,
            record.type,
            record.brand,
            record.model,
            record.serial,
            record.date,
            record.technicianName
        ];
        tableRows.push(rowData);
    });

    // --- 3. Generate AutoTable ---
    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 35, // Start Y position after the header
        theme: 'grid', // 'grid', 'striped', or 'plain'
        headStyles: { fillColor: [0, 86, 179], textColor: [255, 255, 255], fontSize: 8 },
        bodyStyles: { fontSize: 7, textColor: [50, 50, 50] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 35, left: 14, right: 14 },
        didDrawPage: function (data) {
            // Add page numbers at the bottom
            const pageCount = doc.internal.getNumberOfPages();
            doc.setFontSize(8);
            doc.text(`Page ${data.pageNumber} of ${pageCount}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
        }
    });

    // --- 4. Add Signatures at the Bottom ---
    const finalY = doc.lastAutoTable.finalY + 20; // Get Y position after the table ends
    
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text("Prepared by: Hillaly KUBWIMANA", 14, finalY);
    doc.line(14, finalY + 2, 80, finalY + 2); // Signature line

    doc.text("Approved by: Munyaneza Joseph", 140, finalY);
    doc.line(140, finalY + 2, 200, finalY + 2); // Signature line

    // --- 5. Save the PDF ---
    doc.save(`CHUB_AC_PM_Report_${new Date().toISOString().split('T')[0]}.pdf`);
}
