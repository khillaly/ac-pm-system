let currentApprovalRecordId = null;

// 1. Initialize In-Charge Dashboard
function initInChargeDashboard() {
    renderPendingApprovals();
}

// 2. Fetch and Render Pending Approvals
function renderPendingApprovals() {
    const user = JSON.parse(sessionStorage.getItem("currentUser"));
    const container = document.getElementById('pending-list-container');
    
    // Get all PM records from local storage
    let allRecords = JSON.parse(localStorage.getItem('pmRecords')) || [];
    
    // Filter: Must match the In-Charge's department AND status must be "pending"
    const pendingRecords = allRecords.filter(record => 
        record.dept === user.service && record.status === "pending"
    );
    
    container.innerHTML = '';
    
    if (pendingRecords.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#777;">No pending approvals for your department.</p>';
        return;
    }
    
    pendingRecords.forEach(record => {
        const item = document.createElement('div');
        item.className = 'pending-item';
        item.onclick = () => viewPMDetail(record.recordId);
        item.innerHTML = `
            <h4>${record.tag}</h4>
            <p><strong>Location:</strong> ${record.location}</p>
            <p><strong>Technician:</strong> ${record.technicianName}</p>
            <p><strong>Date:</strong> ${record.date}</p>
            <span class="status-badge pending">Pending Review</span>
        `;
        container.appendChild(item);
    });
}

// 3. View PM Detail
function viewPMDetail(recordId) {
    currentApprovalRecordId = recordId;
    let allRecords = JSON.parse(localStorage.getItem('pmRecords')) || [];
    const record = allRecords.find(r => r.recordId === recordId);
    
    if (!record) return;

    // Populate AC Info
    document.getElementById('approval-ac-info').innerHTML = `
        <div class="detail-row"><strong>Tag:</strong> ${record.tag}</div>
        <div class="detail-row"><strong>Location:</strong> ${record.location}</div>
        <div class="detail-row"><strong>Brand:</strong> ${record.brand} | <strong>Model:</strong> ${record.model}</div>
        <div class="detail-row"><strong>Serial:</strong> ${record.serial}</div>
    `;

    // Populate Checklist
    const checklistContainer = document.getElementById('approval-checklist-view');
    checklistContainer.innerHTML = '';
    const template = window.appData.checklistTemplate;
    let currentCategory = '';

    template.forEach(item => {
        if (item.category !== currentCategory) {
            currentCategory = item.category;
            const catHeader = document.createElement('div');
            catHeader.className = 'checklist-category';
            catHeader.innerText = currentCategory;
            checklistContainer.appendChild(catHeader);
        }

        const status = record.checklist[item.id] || 'Not Checked';
        const note = record.notes[item.id] || '';
        const statusColor = status === 'pass' ? 'green' : (status === 'fail' ? 'red' : 'gray');

        const itemDiv = document.createElement('div');
        itemDiv.className = 'checklist-item';
        itemDiv.innerHTML = `
            <p>${item.task}</p>
            <p style="font-size:12px; color:${statusColor}; font-weight:bold;">Status: ${status.toUpperCase()}</p>
            ${note ? `<p style="font-size:12px; color:#555;">Note: ${note}</p>` : ''}
        `;
        checklistContainer.appendChild(itemDiv);
    });

    // Populate Signature
    document.getElementById('tech-signature-img').src = record.signature;

    // Show screen
    document.getElementById('incharge-dashboard').classList.remove('active');
    document.getElementById('pm-approval-screen').classList.add('active');
}

// 4. Approve PM
function approvePM() {
    const comment = document.getElementById('approval-comment').value;
    const user = JSON.parse(sessionStorage.getItem("currentUser"));
    
    let allRecords = JSON.parse(localStorage.getItem('pmRecords')) || [];
    const recordIndex = allRecords.findIndex(r => r.recordId === currentApprovalRecordId);
    
    if (recordIndex !== -1) {
        allRecords[recordIndex].status = "approved";
        allRecords[recordIndex].approvedBy = user.name;
        allRecords[recordIndex].approvedAt = new Date().toISOString();
        allRecords[recordIndex].approvalComment = comment;
        
        localStorage.setItem('pmRecords', JSON.stringify(allRecords));
        alert("✅ PM Approved successfully!");
        goBackToPendingList();
    }
}

// 5. Reject PM
function rejectPM() {
    const comment = document.getElementById('approval-comment').value;
    if (!comment) {
        alert("Please provide a reason for rejection in the comments box.");
        return;
    }
    
    const user = JSON.parse(sessionStorage.getItem("currentUser"));
    let allRecords = JSON.parse(localStorage.getItem('pmRecords')) || [];
    const recordIndex = allRecords.findIndex(r => r.recordId === currentApprovalRecordId);
    
    if (recordIndex !== -1) {
        allRecords[recordIndex].status = "rejected";
        allRecords[recordIndex].approvedBy = user.name;
        allRecords[recordIndex].approvedAt = new Date().toISOString();
        allRecords[recordIndex].rejectionReason = comment;
        
        localStorage.setItem('pmRecords', JSON.stringify(allRecords));
        alert("❌ PM Rejected. The technician will see the reason.");
        goBackToPendingList();
    }
}

// 6. Go Back to Pending List
function goBackToPendingList() {
    document.getElementById('pm-approval-screen').classList.remove('active');
    document.getElementById('incharge-dashboard').classList.add('active');
    document.getElementById('approval-comment').value = "";
    renderPendingApprovals();
}
