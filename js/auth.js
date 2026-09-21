let currentPin = "";
let usersData = [];

// 1. Load the Seed Data when the page loads
async function loadData() {
    try {
        const response = await fetch('data/seed-data.json');
        const data = await response.json();
        
        // Store data globally so other scripts can access it
        window.appData = data; 
        usersData = data.users;
        
        console.log("System data loaded successfully");
        
        // If a user is already logged in (page refresh), route them
        const savedUser = sessionStorage.getItem("currentUser");
        if (savedUser) {
            routeUser(JSON.parse(savedUser));
        }
    } catch (error) {
        console.error("Error loading seed data:", error);
        document.getElementById('error-msg').innerText = "Error loading system data.";
    }
}
loadData();

// 2. Handle Keypad Input
function pressKey(num) {
    if (currentPin.length < 4) {
        currentPin += num;
        updateDisplay();
        document.getElementById('error-msg').innerText = ""; // Clear errors on new input
    }
}

// 3. Clear Input
function clearPin() {
    currentPin = "";
    updateDisplay();
    document.getElementById('error-msg').innerText = "";
}

// 4. Update the PIN display (mask with asterisks)
function updateDisplay() {
    let display = "";
    for (let i = 0; i < 4; i++) {
        display += i < currentPin.length ? "●" : "-";
    }
    document.getElementById('pin-display').innerText = display;
}

// 5. Submit PIN and Authenticate
function submitPin() {
    if (currentPin.length !== 4) {
        document.getElementById('error-msg').innerText = "Please enter a 4-digit PIN.";
        return;
    }

    // Find user with matching PIN
    const user = usersData.find(u => u.pin === currentPin);

    if (user) {
        // Save session
        sessionStorage.setItem("currentUser", JSON.stringify(user));
        routeUser(user);
    } else {
        document.getElementById('error-msg').innerText = "Invalid PIN. Try again.";
        clearPin();
    }
}

// 6. Route user to the correct dashboard
function routeUser(user) {
    // Hide login screen
    document.getElementById('login-screen').classList.remove('active');

    if (user.role === 'technician') {
        document.getElementById('tech-name').innerText = user.name;
        document.getElementById('tech-dashboard').classList.add('active');
        
        // Initialize the technician dashboard (load departments)
        if (typeof initTechnicianDashboard === 'function') {
            initTechnicianDashboard();
        }
    } else if (user.role === 'incharge') {
        document.getElementById('incharge-name').innerText = user.name;
        document.getElementById('incharge-dept').innerText = user.service;
        document.getElementById('incharge-dashboard').classList.add('active');
    }
}

// 7. Logout Function
function logout() {
    sessionStorage.removeItem("currentUser");
    currentPin = "";
    updateDisplay();
    
    // Hide all dashboards, show login
    document.getElementById('tech-dashboard').classList.remove('active');
    document.getElementById('incharge-dashboard').classList.remove('active');
    document.getElementById('login-screen').classList.add('active');
}

// 8. Check if user is already logged in on page refresh
window.onload = () => {
    const savedUser = sessionStorage.getItem("currentUser");
    if (savedUser) {
        routeUser(JSON.parse(savedUser));
    }
};
