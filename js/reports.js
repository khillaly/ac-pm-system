// 1. Show Reports Screen
function showReportsScreen() {
    // Hide all other screens
    document.getElementById('tech-dashboard').classList.remove('active');
    document.getElementById('incharge-dashboard').classList.remove('active');
    document.getElementById('reports-screen').classList.add('active');
    
    // Default filter to approved
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

// 3. Render the Reports Table
function renderReportsTable() {
    const filter = document.getElementById('report-filter').value;
    const tbody = document.getElementById('reports-tbody');
    tbody.innerHTML = '';
    
    // Get all records from local storage
    let allRecords = JSON.parse(localStorage.getItem('pmRecords')) || [];
    
    // Filter based on selection
    let filteredRecords = allRecords;
    if (filter !== 'all') {
        filteredRecords = allRecords.filter(r => r.status === filter);
    }
    
    // Sort by date (newest first)
    filteredRecords.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    if (filteredRecords.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#777;">No records found for this filter.</td></tr>';
        return;
    }

    filteredRecords.forEach(record => {
        const tr = document.createElement('tr');
        
        // Format status badge
        let statusColor = record.status === 'approved' ? 'green' : (record.status === 'pending' ? 'orange' : 'red');
        let approvedBy = record.approvedBy ? record.approvedBy : '-';
        
        tr.innerHTML = `
            <td>${record.date}</td>
            <td><strong>${record.tag}</strong></td>
            <td>${record.dept}</td>
            <td>${record.location}</td>
            <td>${record.technicianName}</td>
            <td style="color:${statusColor}; font-weight:bold;">${record.status.toUpperCase()}</td>
            <td>${approvedBy}</td>
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

    // Define CSV Headers
    const headers = ["Date", "Tag Number", "Department", "Location", "Brand", "Model", "Serial", "Technician", "Status", "Approved By", "Approval Date", "Notes"];
    
    // Build CSV Rows
    const rows = allRecords.map(record => {
        // Combine notes into a single string
        let notesString = "";
        if (record.notes) {
            notesString = Object.entries(record.notes).map(([key, val]) => `${key}: ${val}`).join(" | ");
        }
        
        return [
            record.date,
            `"${record.tag}"`,
            `"${record.dept}"`,
            `"${record.location}"`,
            `"${record.brand}"`,
            `"${record.model}"`,
            `"${record.serial}"`,
            `"${record.technicianName}"`,
            record.status,
            `"${record.approvedBy || ''}"`,
            record.approvedAt ? record.approvedAt.split('T')[0] : '',
            `"${notesString}"`
        ].join(",");
    });

    const csvContent = headers.join(",") + "\n" + rows.join("\n");
    
    // Create a Blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `PM_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 5. Print Report (Triggers browser print dialog)
function printReport() {
    window.print();
}
