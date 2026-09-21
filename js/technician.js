// Global variables
let allACUnits = [];
let selectedDepartment = "";
let selectedAC = null;

// This function is called from auth.js after data is loaded
function initTechnicianDashboard() {
    // Get AC units from the global data loaded in auth.js
    if (window.appData && window.appData.acUnits) {
        allACUnits = window.appData.acUnits;
        renderDepartments();
    }
}

// 1. Render Department Buttons
function renderDepartments() {
    const deptGrid = document.getElementById('dept-grid');
    deptGrid.innerHTML = '';
    
    // Get unique departments from the AC list
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
    
    // Hide tech dashboard, show AC selection
    document.getElementById('tech-dashboard').classList.remove('active');
    document.getElementById('ac-selection-screen').classList.add('active');
    
    populateACDropdown(dept);
}

// 3. Populate the AC Dropdown
function populateACDropdown(dept) {
    const dropdown = document.getElementById('ac-dropdown');
    dropdown.innerHTML = '<option value="">-- Select an AC Unit --</option>';
    
    // Filter ACs for this department
    const filteredACs = allACUnits.filter(ac => ac.dept === dept);
    
    filteredACs.forEach((ac, index) => {
        const option = document.createElement('option');
        option.value = index; // Use index as value to easily retrieve the object
        // Display Tag Number and Location in the dropdown
        option.innerText = `${ac.tag} - ${ac.location}`;
        dropdown.appendChild(option);
    });
}

// 4. Auto-fill AC Details when selected
function fillACDetails() {
    const dropdown = document.getElementById('ac-dropdown');
    const selectedIndex = dropdown.value;
    
    if (selectedIndex === "") {
        document.getElementById('ac-details').style.display = 'none';
        selectedAC = null;
        return;
    }
    
    // Find the AC in the filtered list
    const filteredACs = allACUnits.filter(ac => ac.dept === selectedDepartment);
    selectedAC = filteredACs[selectedIndex];
    
    // Fill the details
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

// 6. Start PM Checklist (Placeholder for Step 4)
function startPMChecklist() {
    if (!selectedAC) return;
    alert(`Starting PM Checklist for: ${selectedAC.tag}\nLocation: ${selectedAC.location}\n\nNext step: Build the checklist!`);
    // In Step 4, we will replace this alert with the actual checklist screen
}
