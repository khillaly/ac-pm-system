// Global variables
let allACUnits = [];
let selectedDepartment = "";
let selectedAC = null;
let pmResults = {};
let pmNotes = {};
let signaturePad, ctx, isDrawing = false;

// Initialize
function initTechnicianDashboard() {
    if (window.appData && window.appData.acUnits) {
        allACUnits = window.appData.acUnits;
        renderDepartments();
    }
}

// 1. Render Department Buttons
function renderDepartments() {
    const deptGrid = document.getElementById('dept-grid');
    deptGrid.innerHTML = '';
    const departments = [...new Set(allACUnits.map(ac => ac.dept))].sort();
    
    departments.forEach(dept => {
        const btn = document.createElement('button');
        btn.className = 'dept-btn';
        btn.innerText = dept;
        btn.onclick = () => selectDepartment(dept);
        deptGrid.appendChild(btn);
    });
}

// 2. Select a Department
function selectDepartment(dept) {
    selectedDepartment = dept;
    document.getElementById('selected-dept-title').innerText = dept;
    document.getElementById('tech-dashboard').classList.remove('active');
    document.getElementById('ac-selection-screen').classList.add('active');
    populateACDropdown(dept);
}

// 3. Populate the AC Dropdown
function populateACDropdown(dept) {
    const dropdown = document.getElementById('ac-dropdown');
    dropdown.innerHTML = '<option value="">-- Select an AC Unit --</option>';
    const filteredACs = allACUnits.filter(ac => ac.dept === dept);
    
    filteredACs.forEach((ac, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.innerText = `${ac.tag} - ${ac.location}`;
        dropdown.appendChild(option);
    });
}

// 4. Auto-fill AC Details
function fillACDetails() {
    const dropdown = document.getElementById('ac-dropdown');
    const selectedIndex = dropdown.value;
    
    if (selectedIndex === "") {
        document.getElementById('ac-details').style.display = 'none';
        selectedAC = null;
        return;
    }
    
    const filteredACs = allACUnits.filter(ac => ac.dept === selectedDepartment);
    selectedAC = filteredACs[selectedIndex];
    
    document.getElementById('detail-tag').innerText = selectedAC.tag || "N/A";
    document.getElementById('detail-type').innerText = selectedAC.type || "N/A";
    document.getElementById('detail-brand').innerText = selectedAC.brand || "N/A";
    document.getElementById('detail-model').innerText = selectedAC.model || "N/A";
    document.getElementById('detail-serial').innerText = selectedAC.serial || "N/A";
    
    document.getElementById('ac-details').style.display = 'block';
}

// 5. Back to Departments
function goBackToDepts() {
    document.getElementById('ac-selection-screen').classList.remove('active');
    document.getElementById('tech-dashboard').classList.add('active');
    document.getElementById('ac-dropdown').value = "";
    document.getElementById('ac-details').style.display = 'none';
}

// 6. Start PM Checklist
function startPMChecklist() {
    if (!selectedAC) return;
    
    // Reset results
    pmResults = {};
    pmNotes = {};
    
    // Show AC info at top of checklist
    document.getElementById('checklist-ac-info').innerHTML = `
        <div class="detail-row"><strong>Tag:</strong> ${selectedAC.tag}</div>
        <div class="detail-row"><strong>Location:</strong> ${selectedAC.location}</div>
        <div class="detail-row"><strong>Brand:</strong> ${selectedAC.brand} | <strong>Model:</strong> ${selectedAC.model}</div>
    `;

    renderChecklist();
    
    document.getElementById('ac-selection-screen').classList.remove('active');
    document.getElementById('pm-checklist-screen').classList.add('active');
    
    setupSignaturePad();
}

// 7. Render the Checklist from seed-data.json
function renderChecklist() {
    const container = document.getElementById('checklist-container');
    container.innerHTML = '';
    
    const template = window.appData.checklistTemplate;
    let currentCategory = '';
    
    template.forEach(item => {
        // Add Category Header
        if (item.category !== currentCategory) {
            currentCategory = item.category;
            const catHeader = document.createElement('div');
            catHeader.className = 'checklist-category';
            catHeader.innerText = currentCategory;
            container.appendChild(catHeader);
        }
        
        // Create Checklist Item
        const itemDiv = document.createElement('div');
        itemDiv.className = 'checklist-item';
        itemDiv.innerHTML = `
            <p>${item.task}</p>
            <div class="status-buttons">
                <button class="status-btn" data-status="pass" onclick="setStatus('${item.id}', 'pass', this)">Pass</button>
                <button class="status-btn" data-status="fail" onclick="setStatus('${item.id}', 'fail', this)">Fail</button>
                <button class="status-btn" data-status="na" onclick="setStatus('${item.id}', 'na', this)">N/A</button>
            </div>
            <input type="text" class="note-input" placeholder="Optional note..." onchange="saveNote('${item.id}', this.value)">
        `;
        container.appendChild(itemDiv);
    });
}

// 8. Set Status (Pass/Fail/N/A)
function setStatus(itemId, status, btnElement) {
    pmResults[itemId] = status;
    
    // Update UI: remove active from siblings, add to clicked
    const parent = btnElement.parentElement;
    parent.querySelectorAll('.status-btn').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');
}

// 9. Save Note
function saveNote(itemId, note) {
    pmNotes[itemId] = note;
}

// 10. Signature Pad Logic
function setupSignaturePad() {
    signaturePad = document.getElementById('signature-pad');
    ctx = signaturePad.getContext('2d');
    ctx.clearRect(0, 0, signaturePad.width, signaturePad.height);
    
    // Mouse events
    signaturePad.onmousedown = (e) => { isDrawing = true; ctx.beginPath(); ctx.moveTo(e.offsetX, e.offsetY); };
    signaturePad.onmousemove = (e) => { if (isDrawing) { ctx.lineTo(e.offsetX, e.offsetY); ctx.stroke(); } };
    signaturePad.onmouseup = () => { isDrawing = false; };
    signaturePad.onmouseout = () => { isDrawing = false; };
    
    // Touch events (for mobile)
    signaturePad.ontouchstart = (e) => { e.preventDefault(); isDrawing = true; const rect = signaturePad.getBoundingClientRect(); ctx.beginPath(); ctx.moveTo(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top); };
    signaturePad.ontouchmove = (e) => { e.preventDefault(); if (isDrawing) { const rect = signaturePad.getBoundingClientRect(); ctx.lineTo(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top); ctx.stroke(); } };
    signaturePad.ontouchend = () => { isDrawing = false; };
}

function clearSignature() {
    ctx.clearRect(0, 0, signaturePad.width, signaturePad.height);
}

// 11. Submit PM Record
function submitPM() {
    // Validation
    if (Object.keys(pmResults).length < window.appData.checklistTemplate.length) {
        alert("Please complete all checklist items before submitting.");
        return;
    }
    
    // Check if signature is empty (simple check, can be improved)
    const blank = document.createElement('canvas');
    blank.width = signaturePad.width;
    blank.height = signaturePad.height;
    if (signaturePad.toDataURL() === blank.toDataURL()) {
        alert("Please provide a technician signature.");
        return;
    }

    const user = JSON.parse(sessionStorage.getItem("currentUser"));
    const signatureData = signaturePad.toDataURL(); // Base64 image

    // Create PM Record
    const pmRecord = {
        recordId: "PM-" + Date.now(),
        tag: selectedAC.tag,
        dept: selectedAC.dept,
        location: selectedAC.location,
        brand: selectedAC.brand,
        model: selectedAC.model,
        serial: selectedAC.serial,
        technicianId: user.id,
        technicianName: user.name,
        date: new Date().toISOString().split('T')[0],
        checklist: pmResults,
        notes: pmNotes,
        signature: signatureData,
        status: "pending", // pending, approved, rejected
        submittedAt: new Date().toISOString()
    };

    // Save to LocalStorage
    let allRecords = JSON.parse(localStorage.getItem('pmRecords')) || [];
    allRecords.push(pmRecord);
    localStorage.setItem('pmRecords', JSON.stringify(allRecords));

    alert("✅ PM Submitted Successfully! It is now pending approval.");
    
    // Reset and go back to dashboard
    goBackToDepts();
}

// 12. Back to AC Selection
function goBackToACSelection() {
    document.getElementById('pm-checklist-screen').classList.remove('active');
    document.getElementById('ac-selection-screen').classList.add('active');
}
