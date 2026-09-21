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
    
    let filteredRecords = allRecords;
    if (filter !== 'all') {
        filteredRecords = allRecords.filter(r => r.status === filter);
    }
    
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

// 5. Generate Smart PDF (One AC per page)
function generateSmartPDF() {
    let allRecords = JSON.parse(localStorage.getItem('pmRecords')) || [];
    const approvedRecords = allRecords.filter(r => r.status === "approved");

    if (approvedRecords.length === 0) {
        alert("No approved records found to generate the report.");
        return;
    }

    const container = document.getElementById('pdf-output-container');
    container.innerHTML = ''; 

    const template = window.appData.checklistTemplate;

    approvedRecords.forEach(record => {
        let pageHtml = `<div class="pdf-page">`;

        // Header
        pageHtml += `
            <div class="pdf-header">
                <div>
                    <div class="pdf-title">AC Preventive Maintenance Report</div>
                    <div class="pdf-site-info">Site: CHUB Hospital</div>
                </div>
                <div class="pdf-meta">
                    <div><strong>Work Date:</strong> ${record.date}</div>
                    <div><strong>Technician:</strong> ${record.technicianName}</div>
                    <div><strong>Generated:</strong> ${new Date().toLocaleDateString()}</div>
                </div>
            </div>
        `;

        // Blue Card
        pageHtml += `
            <div class="pdf-card">
                <h2>${record.tag}</h2>
                <p><strong>Brand/Model:</strong> ${record.brand} ${record.model} | <strong>Type:</strong> ${record.type}</p>
                <p><strong>Location:</strong> ${record.dept} - ${record.location}</p>
                <p><strong>Serial Number:</strong> ${record.serial}</p>
            </div>
        `;

        // Checklist
        const categories = [...new Set(template.map(item => item.category))];
        
        categories.forEach(cat => {
            pageHtml += `<div class="pdf-section">`;
            pageHtml += `<div class="pdf-section-title">${cat}</div>`;
            pageHtml += `<div class="pdf-grid">`;

            const catItems = template.filter(item => item.category === cat);
            
            catItems.forEach(item => {
                const status = record.checklist[item.id] || 'N/A';
                let statusClass = 'pdf-status-na';
                if (status === 'pass') statusClass = 'pdf-status-pass';
                if (status === 'fail') statusClass = 'pdf-status-fail';

                const note = (record.notes && record.notes[item.id]) 
                    ? `<span class="pdf-note">Note: ${record.notes[item.id]}</span>` 
                    : '';

                pageHtml += `
                    <div class="pdf-grid-item">
                        <div>• ${item.task} <span class="${statusClass}">[${status.toUpperCase()}]</span></div>
                        ${note}
                    </div>
                `;
            });

            pageHtml += `</div></div>`; 
        });

        // Signatures
        pageHtml += `
            <div class="pdf-footer">
                <div class="pdf-signature-box">
                    <div><strong>Prepared by:</strong> ${record.technicianName}</div>
                    <div class="pdf-signature-line">Technician Signature</div>
                </div>
                <div class="pdf-signature-box">
                    <div><strong>Approved by:</strong> ${record.approvedBy || 'Pending'}</div>
                    <div class="pdf-signature-line">In-Charge Signature</div>
                </div>
            </div>
        `;

        pageHtml += `</div>`; 
        container.innerHTML += pageHtml;
    });

    // Convert to PDF
    container.style.opacity = '1';
    container.style.zIndex = '9999';
    container.style.position = 'relative';

    const opt = {
        margin:       0,
        filename:     `CHUB_AC_PM_Report_${new Date().toISOString().split('T')[0]}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, scrollY: 0 },
        jsPDF:        { unit: 'px', format: [800, 1130], orientation: 'portrait' } 
    };

       // --- 5. Convert HTML to PDF ---
    const opt = {
        margin:       0,
        filename:     `CHUB_AC_PM_Report_${new Date().toISOString().split('T')[0]}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        // windowWidth: 800 forces the library to render the off-screen container correctly
        html2canvas:  { scale: 2, useCORS: true, scrollY: 0, windowWidth: 800 }, 
        jsPDF:        { unit: 'px', format: [800, 1130], orientation: 'portrait' } 
    };

    // Generate and download the PDF
    html2pdf().set(opt).from(container).save().then(() => {
        // PDF Downloaded! Clear the container to keep the app clean
        container.innerHTML = ''; 
    });
}
}
