// ====================================
// FIXED public/script.js - PART 1
// ====================================

// Global variables
let currentUser = null;
let currentRole = 'admin';
let students = [];
let fees = [];
let teachers = [];
let grades = [];
let enrollmentChart = null;
let feeChart = null;
let allocations = [];
let attendance = [];
let announcements = [];
let subjects = [];
let classes = [];

// Debug flag
const DEBUG = true;

// Debug logger
function debugLog(message, data = null) {
    if (DEBUG) {
        console.log(`[DEBUG] ${message}`, data || '');
    }
}

// Configuration
const API_BASE = '';
const TOKEN_KEY = 'edumanage_token';
const USER_KEY = 'edumanage_user';

// ====================================
// FIXED AUTHENTICATION HEADERS
// ====================================
function authHeaders() {
    const token = localStorage.getItem(TOKEN_KEY);
    console.log('ðŸ”‘ Getting auth headers:', { hasToken: !!token });
    
    if (!token) {
        console.warn('âš ï¸ No token found in localStorage');
        return { 'Content-Type': 'application/json' };
    }
    
    return { 
        'Authorization': `Bearer ${token}`, 
        'Content-Type': 'application/json' 
    };
}

// Utility functions
function showLoading(show = true) {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = show ? 'flex' : 'none';
    }
}

function setButtonLoading(button, loading = true) {
    if (!button) return;
    
    const textSpan = button.querySelector('.btn-text');
    const spinnerSpan = button.querySelector('.btn-spinner');
    
    if (loading) {
        button.classList.add('loading');
        button.disabled = true;
        if (textSpan) textSpan.style.display = 'none';
        if (spinnerSpan) spinnerSpan.style.display = 'inline-flex';
    } else {
        button.classList.remove('loading');
        button.disabled = false;
        if (textSpan) textSpan.style.display = 'inline';
        if (spinnerSpan) spinnerSpan.style.display = 'none';
    }
}

function clearFormErrors(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    const errorMessages = form.querySelectorAll('.error-message');
    errorMessages.forEach(error => error.textContent = '');
    
    const errorInputs = form.querySelectorAll('.form-control.error');
    errorInputs.forEach(input => input.classList.remove('error'));
}

function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(fieldId + 'Error');
    
    if (field) field.classList.add('error');
    if (errorElement) errorElement.textContent = message;
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatCurrency(amount) {
    return `GHS ${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// DOM Elements
const elements = {
    signupPage: document.getElementById('signupPage'),
    loginPage: document.getElementById('loginPage'),
    dashboard: document.getElementById('dashboard'),
    roleBadge: document.getElementById('roleBadge'),
    signupBtn: document.getElementById('signupBtn'),
    loginBtn: document.getElementById('loginBtn'),
    showLogin: document.getElementById('showLogin'),
    showSignup: document.getElementById('showSignup'),
    logoutBtn: document.getElementById('logoutBtn'),
    userAvatar: document.getElementById('userAvatar'),
    userName: document.getElementById('userName'),
    globalSearch: document.getElementById('globalSearch'),
    contentArea: document.getElementById('contentArea'),
    studentsTableBody: document.getElementById('studentsTableBody'),
    feeTableBody: document.getElementById('feeTableBody'),
    totalStudents: document.getElementById('totalStudents'),
    totalFees: document.getElementById('totalFees'),
    addStudentForm: document.getElementById('addStudentForm'),
    studentModal: document.getElementById('studentModal'),
    paymentModal: document.getElementById('paymentModal'),
    receiptSection: document.getElementById('receiptSection'),
    toastNotification: document.getElementById('toastNotification'),
    toastMessage: document.getElementById('toastMessage'),
    toastIcon: document.getElementById('toastIcon')
};

// ====================================
// INITIALIZE APPLICATION
// ====================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('ðŸš€ Application initializing...');
    initializeAuth();
    initializeEventListeners();
    checkAuthStatus();
});

function initializeAuth() {
    const storedUser = localStorage.getItem(USER_KEY);
    const storedToken = localStorage.getItem(TOKEN_KEY);
    
    console.log('ðŸ” Checking stored credentials:', { 
        hasUser: !!storedUser, 
        hasToken: !!storedToken 
    });
    
    if (storedUser && storedToken) {
        try {
            currentUser = JSON.parse(storedUser);
            console.log('âœ… Found stored user:', currentUser.email);
            showDashboard();
            
            // Load data after showing dashboard
            setTimeout(() => {
                loadDashboardData();
            }, 300);
        } catch (error) {
            console.error('âŒ Error parsing stored user data:', error);
            logout();
        }
    } else {
        console.log('â„¹ï¸ No stored credentials, showing login page');
        showLoginPage();
    }
}

function initializeEventListeners() {
    const signupForm = document.getElementById('signupForm');
    const loginForm = document.getElementById('loginForm');
    
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (elements.showLogin) {
        elements.showLogin.addEventListener('click', showLoginPage);
    }
    
    if (elements.showSignup) {
        elements.showSignup.addEventListener('click', showSignupPage);
    }
    
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', logout);
    }
    
    initializeRoleSelection();
    initializeNavigation();
    
    const studentForm = document.getElementById('studentForm');
    if (studentForm) {
        studentForm.addEventListener('submit', handleAddStudent);
    }
    
    const resetStudentForm = document.getElementById('resetStudentForm');
    if (resetStudentForm) {
        resetStudentForm.addEventListener('click', () => {
            studentForm.reset();
            clearFormErrors('studentForm');
        });
    }
    
    if (elements.globalSearch) {
        elements.globalSearch.addEventListener('keyup', handleGlobalSearch);
    }
    
    initializeModals();
    initializeTabs();
    initializeReceiptActions();
    initializeTableEvents();
}

// ====================================
// ADD THESE MISSING FUNCTIONS TO script.js
// Add after the initializeEventListeners function
// ====================================

function initializeRoleSelection() {
    const roleOptions = document.querySelectorAll('.role-option');
    
    roleOptions.forEach(option => {
        option.addEventListener('click', function() {
            const container = this.closest('.role-selector');
            const allOptions = container.querySelectorAll('.role-option');
            
            allOptions.forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
            currentRole = this.dataset.role;
            console.log('Selected role:', currentRole);
        });
    });
}

function initializeNavigation() {
    const navItems = document.querySelectorAll('.nav-item:not(#logoutBtn)');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            if (!this.dataset.page) return;
            
            navItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            
            const page = this.dataset.page;
            navigateToPage(page);
        });
    });
}

function navigateToPage(page) {
    const pageTitle = document.querySelector('.page-title');
    if (pageTitle) {
        const roleHtml = `<span class="role-badge ${currentUser.role}">${currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}</span>`;
        pageTitle.innerHTML = `${page.charAt(0).toUpperCase() + page.slice(1)} ${roleHtml}`;
    }
    
    console.log('Navigating to page:', page);
    
    switch (page) {
        case 'dashboard':
            showDashboardContent();
            setTimeout(() => {
                updateDashboardStats();
            }, 0);
            break;
        case 'students':
            showStudentsContent();
            break;
        case 'teachers':
            showTeachersContent();
            break;
        case 'academic':
            showAcademicContent();
            break;
        case 'finance':
            showFinanceContent();
            break;
        case 'reports':
            showReportsContent();
            break;
        case 'allocations':
            showAllocationsContent();
            break;
        case 'attendance':
            showAttendanceContent();
            break;
        case 'announcements':
            showAnnouncementsContent();
            break;
        default:
            showDashboardContent();
    }
}

function showDashboardContent() {
    const currentStudentCount = students.length;
    const currentTotalFees = calculateTotalFees();
    
    elements.contentArea.innerHTML = `
        <div class="dashboard-overview">
            <div class="stat-card students">
                <div class="stat-icon">
                    <i class="fas fa-user-graduate"></i>
                </div>
                <div class="stat-info">
                    <h3 id="totalStudents">${currentStudentCount}</h3>
                    <p>Total Students</p>
                </div>
            </div>
            <div class="stat-card teachers">
                <div class="stat-icon">
                    <i class="fas fa-chalkboard-teacher"></i>
                </div>
                <div class="stat-info">
                    <h3 id="totalTeachers">${teachers.length}</h3>
                    <p>Teachers</p>
                </div>
            </div>
            <div class="stat-card fees">
                <div class="stat-icon">
                    <i class="fas fa-money-bill-wave"></i>
                </div>
                <div class="stat-info">
                    <h3 id="totalFees">${currentTotalFees}</h3>
                    <p>Total Fees Collected</p>
                </div>
            </div>
            <div class="stat-card attendance">
                <div class="stat-icon">
                    <i class="fas fa-clipboard-check"></i>
                </div>
                <div class="stat-info">
                    <h3>92%</h3>
                    <p>Attendance Rate</p>
                </div>
            </div>
        </div>

        <div class="charts-container">
            <div class="chart-card">
                <div class="chart-header">
                    <div class="chart-title">Student Enrollment</div>
                    <div class="chart-actions">
                        <button title="Refresh"><i class="fas fa-sync"></i></button>
                        <button title="Fullscreen"><i class="fas fa-expand"></i></button>
                    </div>
                </div>
                <div class="chart-container">
                    <canvas id="enrollmentChart"></canvas>
                </div>
            </div>
            <div class="chart-card">
                <div class="chart-header">
                    <div class="chart-title">Fee Collection</div>
                    <div class="chart-actions">
                        <button title="Refresh"><i class="fas fa-sync"></i></button>
                        <button title="Fullscreen"><i class="fas fa-expand"></i></button>
                    </div>
                </div>
                <div class="chart-container">
                    <canvas id="feeChart"></canvas>
                </div>
            </div>
        </div>

        <div class="recent-section">
            <div class="section-header">
                <div class="section-title">Recent Students</div>
                <div class="view-all" onclick="navigateToPage('students')">View All</div>
            </div>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Student ID</th>
                            <th>Name</th>
                            <th>Class</th>
                            <th>Parent</th>
                            <th>Contact</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody id="studentsTableBody"></tbody>
                </table>
            </div>
        </div>

        <div class="recent-section">
            <div class="section-header">
                <div class="section-title">Fee Records</div>
                <div class="tabs">
                    <div class="tab active" data-tab="all">All Fees</div>
                    <div class="tab" data-tab="paid">Paid</div>
                    <div class="tab" data-tab="pending">Pending</div>
                    <div class="tab" data-tab="overdue">Overdue</div>
                </div>
            </div>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Invoice ID</th>
                            <th>Student</th>
                            <th>Class</th>
                            <th>Amount</th>
                            <th>Paid</th>
                            <th>Balance</th>
                            <th>Due Date</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody id="feeTableBody"></tbody>
                </table>
            </div>
        </div>
    `;
    
    elements.studentsTableBody = document.getElementById('studentsTableBody');
    elements.feeTableBody = document.getElementById('feeTableBody');
    elements.totalStudents = document.getElementById('totalStudents');
    elements.totalFees = document.getElementById('totalFees');
    
    populateStudentsTable();
    populateFeesTable();
    
    setTimeout(() => {
        initCharts();
        initializeTabs();
    }, 100);
}

function initializeModals() {
    const closeStudentModal = document.getElementById('closeStudentModal');
    const closeStudentModalBtn = document.getElementById('closeStudentModalBtn');
    
    if (closeStudentModal) {
        closeStudentModal.addEventListener('click', () => hideModal('studentModal'));
    }
    if (closeStudentModalBtn) {
        closeStudentModalBtn.addEventListener('click', () => hideModal('studentModal'));
    }
    
    const closePaymentModal = document.getElementById('closePaymentModal');
    const closePaymentModalBtn = document.getElementById('closePaymentModalBtn');
    const confirmPayment = document.getElementById('confirmPayment');
    
    if (closePaymentModal) {
        closePaymentModal.addEventListener('click', () => hideModal('paymentModal'));
    }
    if (closePaymentModalBtn) {
        closePaymentModalBtn.addEventListener('click', () => hideModal('paymentModal'));
    }
    if (confirmPayment) {
        confirmPayment.addEventListener('click', handlePayment);
    }
    
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            hideModal(e.target.id);
        }
    });
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function initializeTabs() {
    const tabs = document.querySelectorAll('.tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const container = this.closest('.tabs');
            const allTabs = container.querySelectorAll('.tab');
            
            allTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            const filter = this.dataset.tab;
            filterFees(filter);
        });
    });
}

function filterFees(filter) {
    let filteredFees = fees;
    
    if (filter !== 'all') {
        filteredFees = fees.filter(fee => {
            if (filter === 'pending') {
                return fee.status === 'pending' || fee.status === 'partial';
            }
            return fee.status === filter;
        });
    }
    
    if (!elements.feeTableBody) return;
    
    elements.feeTableBody.innerHTML = '';
    
    if (filteredFees.length === 0) {
        elements.feeTableBody.innerHTML = '<tr><td colspan="9" class="text-center">No records found</td></tr>';
        return;
    }
    
    filteredFees.forEach(fee => {
        const row = document.createElement('tr');
        
        let statusClass = fee.status;
        if (fee.balance > 0 && fee.balance < fee.amount) {
            statusClass = 'partial';
        }
        
        row.innerHTML = `
            <td>${fee.id}</td>
            <td>${fee.student}</td>
            <td>${fee.class}</td>
            <td>${formatCurrency(fee.amount)}</td>
            <td>${formatCurrency(fee.totalPaid)}</td>
            <td><strong>${formatCurrency(fee.balance)}</strong></td>
            <td>${formatDate(fee.dueDate)}</td>
            <td><span class="status ${statusClass}">${fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}</span></td>
            <td>
                <button class="action-btn pay-fee" ${fee.balance <= 0 ? 'disabled' : ''} data-fee-id="${fee.id}">
                    ${fee.balance <= 0 ? 'Paid' : fee.totalPaid > 0 ? 'Pay Balance' : 'Pay'}
                </button>
            </td>
        `;
        
        elements.feeTableBody.appendChild(row);
    });
}

function initializeReceiptActions() {
    const closeReceipt = document.getElementById('closeReceipt');
    const printReceiptBtn = document.getElementById('printReceiptBtn');
    
    if (closeReceipt) {
        closeReceipt.addEventListener('click', () => {
            elements.receiptSection.style.display = 'none';
        });
    }
    
    if (printReceiptBtn) {
        printReceiptBtn.addEventListener('click', printReceipt);
    }
}

function printReceipt() {
    window.print();
}

function initializeTableEvents() {
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('view-student')) {
            const row = e.target.closest('tr');
            const studentId = row.cells[0].textContent;
            showStudentDetails(studentId);
        }
        
        if (e.target.classList.contains('pay-fee') && !e.target.disabled) {
            const feeId = e.target.dataset.feeId || e.target.closest('tr').cells[0].textContent;
            showPaymentForm(feeId);
        }
    });
}

function showStudentDetails(studentId) {
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    
    const modalBody = document.querySelector('#studentModal .modal-body');
    
    modalBody.innerHTML = `
        <div class="student-profile">
            <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 20px;">
                <div class="user-avatar" style="width: 80px; height: 80px; font-size: 24px;">${student.name.charAt(0)}</div>
                <div>
                    <h2 style="margin-bottom: 5px;">${student.name}</h2>
                    <p>Student ID: ${student.id}</p>
                    <p>${student.class}</p>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Date of Birth</label>
                    <p>${student.dob ? formatDate(student.dob) : 'N/A'}</p>
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <p>${student.email || 'N/A'}</p>
                </div>
                <div class="form-group">
                    <label>Phone</label>
                    <p>${student.phone || 'N/A'}</p>
                </div>
                <div class="form-group">
                    <label>Parent/Guardian</label>
                    <p>${student.parent || 'N/A'}</p>
                </div>
                <div class="form-group">
                    <label>Parent Phone</label>
                    <p>${student.parentPhone || 'N/A'}</p>
                </div>
                <div class="form-group">
                    <label>Address</label>
                    <p>${student.address || 'N/A'}</p>
                </div>
            </div>
        </div>
    `;
    
    showModal('studentModal');
}

function showPaymentForm(feeId) {
    console.log('Show payment form for fee:', feeId);
    showToast('Payment feature coming soon!', 'info');
}

function handlePayment() {
    console.log('Handle payment');
    showToast('Payment processing...', 'info');
}

function handleGlobalSearch(e) {
    if (e.key === 'Enter') {
        const searchTerm = e.target.value.toLowerCase().trim();
        console.log('Searching for:', searchTerm);
        if (searchTerm) {
            const filtered = students.filter(s => 
                s.name.toLowerCase().includes(searchTerm) ||
                s.id.toLowerCase().includes(searchTerm) ||
                s.email.toLowerCase().includes(searchTerm)
            );
            populateStudentsTable(filtered);
        } else {
            populateStudentsTable();
        }
    }
}

function setRolePermissions() {
    if (!currentUser) return;
    console.log('Setting permissions for role:', currentUser.role);
    // Add role-based permission logic here if needed
}

function initCharts() {
    initEnrollmentChart();
    initFeeChart();
}

function initEnrollmentChart() {
    const ctx = document.getElementById('enrollmentChart');
    if (!ctx) return;
    
    if (enrollmentChart) {
        enrollmentChart.destroy();
    }
    
    enrollmentChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: '2025 Enrollment',
                data: [120, 190, 150, 200, 180, 220, 250, 280, 300, 320, 350, students.length],
                borderColor: '#4361ee',
                backgroundColor: 'rgba(67, 97, 238, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        drawBorder: false
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function initFeeChart() {
    const ctx = document.getElementById('feeChart');
    if (!ctx) return;
    
    if (feeChart) {
        feeChart.destroy();
    }
    
    const totalCollected = fees.reduce((sum, fee) => sum + (fee.totalPaid || 0), 0);
    
    feeChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
            datasets: [{
                label: 'Fee Collection (in GHS)',
                data: [12500, 14200, 11800, 15600, 17200, 16500, Math.round(totalCollected)],
                backgroundColor: 'rgba(76, 201, 240, 0.6)',
                borderColor: 'rgba(76, 201, 240, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        drawBorder: false
                    },
                    ticks: {
                        callback: function(value) {
                            return 'GHS ' + value.toLocaleString();
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Placeholder functions for other pages
function showStudentsContent() {
    elements.contentArea.innerHTML = '<div class="recent-section"><h2>Students Page - Coming Soon</h2></div>';
}

function showTeachersContent() {
    elements.contentArea.innerHTML = '<div class="recent-section"><h2>Teachers Page - Coming Soon</h2></div>';
}

function showAcademicContent() {
    elements.contentArea.innerHTML = '<div class="recent-section"><h2>Academic Page - Coming Soon</h2></div>';
}

function showFinanceContent() {
    elements.contentArea.innerHTML = '<div class="recent-section"><h2>Finance Page - Coming Soon</h2></div>';
}

function showReportsContent() {
    elements.contentArea.innerHTML = '<div class="recent-section"><h2>Reports Page - Coming Soon</h2></div>';
}

function showAllocationsContent() {
    elements.contentArea.innerHTML = '<div class="recent-section"><h2>Allocations Page - Coming Soon</h2></div>';
}

function showAttendanceContent() {
    elements.contentArea.innerHTML = '<div class="recent-section"><h2>Attendance Page - Coming Soon</h2></div>';
}

function showAnnouncementsContent() {
    elements.contentArea.innerHTML = '<div class="recent-section"><h2>Announcements Page - Coming Soon</h2></div>';
}

function handleAddStudent(e) {
    e.preventDefault();
    console.log('Add student');
    showToast('Feature coming soon!', 'info');
}

// Global error handler
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
});

console.log('âœ… All initialization functions loaded');
// ====================================
// FIXED LOGIN HANDLER
// ====================================
async function handleLogin(e) {
    e.preventDefault();
    
    console.log('ðŸ” Login attempt started...');
    clearFormErrors('loginForm');
    setButtonLoading(elements.loginBtn, true);
    
    const formData = {
        email: document.getElementById('loginEmail').value.trim(),
        password: document.getElementById('loginPassword').value,
        role: currentRole
    };
    
    console.log('ðŸ“ Login data:', { email: formData.email, role: formData.role });
    
    let hasErrors = false;
    
    if (!formData.email) {
        showFieldError('loginEmail', 'Email is required');
        hasErrors = true;
    } else if (!validateEmail(formData.email)) {
        showFieldError('loginEmail', 'Please enter a valid email address');
        hasErrors = true;
    }
    
    if (!formData.password) {
        showFieldError('loginPassword', 'Password is required');
        hasErrors = true;
    }
    
    if (hasErrors) {
        setButtonLoading(elements.loginBtn, false);
        return;
    }
    
    try {
        console.log('ðŸ“¤ Sending login request...');
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        console.log('ðŸ“¥ Login response status:', response.status);
        const data = await response.json();
        console.log('ðŸ“¥ Login response data:', data);
        
        if (data.success && data.token) {
            currentUser = data.user;
            localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
            localStorage.setItem(TOKEN_KEY, data.token);
            
            console.log('âœ… Login successful:', currentUser.email);
            console.log('âœ… Token saved:', data.token.substring(0, 20) + '...');
            
            showToast(`Welcome, ${currentUser.name}!`, 'success');
            
            // Show dashboard FIRST
            showDashboard();
            
            // Then load data after a small delay
            setTimeout(() => {
                console.log('ðŸ“Š Loading dashboard data...');
                loadDashboardData();
            }, 300);
        } else {
            console.error('âŒ Login failed:', data.message);
            showToast(data.message || 'Login failed. Please check your credentials.', 'error');
        }
    } catch (error) {
        console.error('âŒ Login error:', error);
        showToast('Network error. Please try again.', 'error');
    } finally {
        setButtonLoading(elements.loginBtn, false);
    }
}

// Signup handler
async function handleSignup(e) {
    e.preventDefault();
    
    clearFormErrors('signupForm');
    setButtonLoading(elements.signupBtn, true);
    
    const formData = {
        name: document.getElementById('signupName').value.trim(),
        email: document.getElementById('signupEmail').value.trim(),
        password: document.getElementById('signupPassword').value,
        school: document.getElementById('signupSchool').value.trim(),
        role: currentRole
    };
    
    let hasErrors = false;
    
    if (!formData.name) {
        showFieldError('signupName', 'Name is required');
        hasErrors = true;
    }
    
    if (!formData.email) {
        showFieldError('signupEmail', 'Email is required');
        hasErrors = true;
    } else if (!validateEmail(formData.email)) {
        showFieldError('signupEmail', 'Please enter a valid email address');
        hasErrors = true;
    }
    
    if (!formData.password) {
        showFieldError('signupPassword', 'Password is required');
        hasErrors = true;
    } else if (formData.password.length < 6) {
        showFieldError('signupPassword', 'Password must be at least 6 characters');
        hasErrors = true;
    }
    
    if (hasErrors) {
        setButtonLoading(elements.signupBtn, false);
        return;
    }
    
    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        const text = await response.text();
        
        if (response.ok) {
            showToast('Account created successfully! Please sign in.', 'success');
            showLoginPage();
            document.getElementById('loginEmail').value = formData.email;
        } else {
            showToast(text, 'error');
        }
    } catch (error) {
        console.error('Signup error:', error);
        showToast('Network error. Please try again.', 'error');
    } finally {
        setButtonLoading(elements.signupBtn, false);
    }
}

function logout() {
    console.log('ðŸšª Logging out...');
    currentUser = null;
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    
    students = [];
    fees = [];
    teachers = [];
    grades = [];
    
    showLoginPage();
    showToast('You have been logged out', 'info');
}

function checkAuthStatus() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    
    fetch('/me', { headers: authHeaders() })
        .then(response => {
            if (!response.ok) {
                console.warn('âš ï¸ Auth check failed, logging out');
                logout();
            }
        })
        .catch(() => {
            console.warn('âš ï¸ Auth check error, logging out');
            logout();
        });
}
// Page navigation functions
function showSignupPage() {
    elements.signupPage.style.display = 'flex';
    elements.loginPage.style.display = 'none';
    elements.dashboard.style.display = 'none';
}

function showLoginPage() {
    elements.signupPage.style.display = 'none';
    elements.loginPage.style.display = 'flex';
    elements.dashboard.style.display = 'none';
}



function updateUserInterface() {
    if (!currentUser) return;
    
    elements.roleBadge.textContent = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);
    elements.roleBadge.className = `role-badge ${currentUser.role}`;
    elements.userAvatar.textContent = currentUser.name.charAt(0).toUpperCase();
    elements.userName.textContent = currentUser.name;
    
    const pageTitle = document.querySelector('.page-title');
    if (pageTitle) {
        const titleText = pageTitle.textContent.split(' ')[0];
        pageTitle.innerHTML = `${titleText} <span class="role-badge ${currentUser.role}" id="roleBadge">${currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}</span>`;
    }
}

function navigateToPage(page) {
    const pageTitle = document.querySelector('.page-title');
    if (pageTitle) {
        const roleHtml = `<span class="role-badge ${currentUser.role}">${currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}</span>`;
        pageTitle.innerHTML = `${page.charAt(0).toUpperCase() + page.slice(1)} ${roleHtml}`;
    }
    
    switch (page) {
        case 'dashboard':
            showDashboardContent();
            setTimeout(() => {
                updateDashboardStats();
            }, 0);
            break;
        case 'students':
            showStudentsContent();
            break;
        case 'teachers':
            showTeachersContent();
            break;
        case 'academic':
            showAcademicContent();
            break;
        case 'finance':
            showFinanceContent();
            break;
        case 'reports':
            showReportsContent();
            break;
        default:
            showDashboardContent();
    }
}

function showDashboardContent() {
    const currentStudentCount = students.length;
    const currentTotalFees = calculateTotalFees();
    
    elements.contentArea.innerHTML = `
        <div class="dashboard-overview">
            <div class="stat-card students">
                <div class="stat-icon">
                    <i class="fas fa-user-graduate"></i>
                </div>
                <div class="stat-info">
                    <h3 id="totalStudents">${currentStudentCount}</h3>
                    <p>Total Students</p>
                </div>
            </div>
            <div class="stat-card teachers">
                <div class="stat-icon">
                    <i class="fas fa-chalkboard-teacher"></i>
                </div>
                <div class="stat-info">
                    <h3 id="totalTeachers">${teachers.length}</h3>
                    <p>Teachers</p>
                </div>
            </div>
            <div class="stat-card fees">
                <div class="stat-icon">
                    <i class="fas fa-money-bill-wave"></i>
                </div>
                <div class="stat-info">
                    <h3 id="totalFees">${currentTotalFees}</h3>
                    <p>Total Fees Collected</p>
                </div>
            </div>
            <div class="stat-card attendance">
                <div class="stat-icon">
                    <i class="fas fa-clipboard-check"></i>
                </div>
                <div class="stat-info">
                    <h3>92%</h3>
                    <p>Attendance Rate</p>
                </div>
            </div>
        </div>

        <div class="charts-container">
            <div class="chart-card">
                <div class="chart-header">
                    <div class="chart-title">Student Enrollment</div>
                    <div class="chart-actions">
                        <button title="Refresh"><i class="fas fa-sync"></i></button>
                        <button title="Fullscreen"><i class="fas fa-expand"></i></button>
                    </div>
                </div>
                <div class="chart-container">
                    <canvas id="enrollmentChart"></canvas>
                </div>
            </div>
            <div class="chart-card">
                <div class="chart-header">
                    <div class="chart-title">Fee Collection</div>
                    <div class="chart-actions">
                        <button title="Refresh"><i class="fas fa-sync"></i></button>
                        <button title="Fullscreen"><i class="fas fa-expand"></i></button>
                    </div>
                </div>
                <div class="chart-container">
                    <canvas id="feeChart"></canvas>
                </div>
            </div>
        </div>

        <div class="recent-section">
            <div class="section-header">
                <div class="section-title">Recent Students</div>
                <div class="view-all" onclick="navigateToPage('students')">View All</div>
            </div>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Student ID</th>
                            <th>Name</th>
                            <th>Class</th>
                            <th>Parent</th>
                            <th>Contact</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody id="studentsTableBody"></tbody>
                </table>
            </div>
        </div>

        <div class="recent-section">
            <div class="section-header">
                <div class="section-title">Fee Records</div>
                <div class="tabs">
                    <div class="tab active" data-tab="all">All Fees</div>
                    <div class="tab" data-tab="paid">Paid</div>
                    <div class="tab" data-tab="pending">Pending</div>
                    <div class="tab" data-tab="overdue">Overdue</div>
                </div>
            </div>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Invoice ID</th>
                            <th>Student</th>
                            <th>Class</th>
                            <th>Amount</th>
                            <th>Paid</th>
                            <th>Balance</th>
                            <th>Due Date</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody id="feeTableBody"></tbody>
                </table>
            </div>
        </div>
    `;
    
    elements.studentsTableBody = document.getElementById('studentsTableBody');
    elements.feeTableBody = document.getElementById('feeTableBody');
    elements.totalStudents = document.getElementById('totalStudents');
    elements.totalFees = document.getElementById('totalFees');
    
    populateStudentsTable();
    populateFeesTable();
    
    setTimeout(() => {
        initCharts();
        initializeTabs();
    }, 100);
}

function showStudentsContent() {
    const uniqueClasses = [...new Set(students.map(s => s.class).filter(c => c))].sort();
    
    elements.contentArea.innerHTML = `
        <div class="form-container" id="addStudentForm">
            <div class="form-title">Add New Student</div>
            <form id="studentForm" novalidate>
                <div class="form-row">
                    <div class="form-group">
                        <label for="studentName">Full Name *</label>
                        <input type="text" id="studentName" class="form-control" placeholder="Enter full name" required>
                        <span class="error-message" id="studentNameError"></span>
                    </div>
                    <div class="form-group">
                        <label for="studentEmail">Email Address</label>
                        <input type="email" id="studentEmail" class="form-control" placeholder="Enter email">
                        <span class="error-message" id="studentEmailError"></span>
                    </div>
                    <div class="form-group">
                        <label for="studentPhone">Phone Number</label>
                        <input type="tel" id="studentPhone" class="form-control" placeholder="Enter phone number">
                        <span class="error-message" id="studentPhoneError"></span>
                    </div>
                    <div class="form-group">
                        <label for="studentDOB">Date of Birth</label>
                        <input type="date" id="studentDOB" class="form-control">
                        <span class="error-message" id="studentDOBError"></span>
                    </div>
                    <div class="form-group">
                        <label for="studentClass">Class/Grade</label>
                        <select id="studentClass" class="form-control">
                            <option value="">Select Class</option
                            <option value="Grade 7A">Grade 7A</option>
                            <option value="Grade 7B">Grade 7B</option>
                            <option value="Grade 8A">Grade 8A</option>
                            <option value="Grade 8B">Grade 8B</option>
                            <option value="Grade 9A">Grade 9A</option>
                            <option value="Grade 9B">Grade 9B</option>
                        </select>
                        <span class="error-message" id="studentClassError"></span>
                    </div>
                    <div class="form-group">
                        <label for="parentName">Parent/Guardian Name</label>
                        <input type="text" id="parentName" class="form-control" placeholder="Enter parent/guardian name">
                        <span class="error-message" id="parentNameError"></span>
                    </div>
                    <div class="form-group">
                        <label for="parentPhone">Parent Phone</label>
                        <input type="tel" id="parentPhone" class="form-control" placeholder="Enter parent phone">
                        <span class="error-message" id="parentPhoneError"></span>
                    </div>
                    <div class="form-group">
                        <label for="studentAddress">Address</label>
                        <textarea id="studentAddress" class="form-control" rows="2" placeholder="Enter address"></textarea>
                        <span class="error-message" id="studentAddressError"></span>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="action-btn outline" id="resetStudentForm">Reset</button>
                    <button type="submit" class="action-btn" id="saveStudentBtn">
                        <span class="btn-text">Add Student</span>
                        <span class="btn-spinner" style="display: none;"><i class="fas fa-spinner fa-spin"></i></span>
                    </button>
                </div>
            </form>
        </div>

        <div class="recent-section">
            <div class="section-header">
                <div class="section-title">All Students</div>
                <div style="display: flex; align-items: center; gap: 15px;">
                    <button class="action-btn" id="exportStudentsBtn">
                        <i class="fas fa-file-excel"></i> Export to Excel
                    </button>
                    <select id="classFilter" class="form-control" style="width: 200px; padding: 8px 12px;">
                        <option value="all">All Classes (${students.length})</option>
                        ${uniqueClasses.map(cls => {
                            const count = students.filter(s => s.class === cls).length;
                            return `<option value="${cls}">${cls} (${count})</option>`;
                        }).join('')}
                    </select>
                    <div class="view-all">Total: ${students.length}</div>
                </div>
            </div>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Student ID</th>
                            <th>Name</th>
                            <th>Class</th>
                            <th>Parent</th>
                            <th>Contact</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody id="studentsTableBody"></tbody>
                </table>
            </div>
        </div>
    `;
    
    elements.studentsTableBody = document.getElementById('studentsTableBody');
    
    const studentForm = document.getElementById('studentForm');
    if (studentForm) {
        studentForm.addEventListener('submit', handleAddStudent);
    }
    
    const resetBtn = document.getElementById('resetStudentForm');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            studentForm.reset();
            clearFormErrors('studentForm');
        });
    }
    
    const classFilter = document.getElementById('classFilter');
    if (classFilter) {
        classFilter.addEventListener('change', (e) => {
            filterStudentsByClass(e.target.value);
        });
    }
    
    const exportBtn = document.getElementById('exportStudentsBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportStudentsToExcel);
    }
    
    populateStudentsTable();
    setRolePermissions();
}



// Data loading functions

// ====================================
// FIXED DASHBOARD DATA LOADING
// ====================================

async function loadDashboardData() {
    try {
        showLoading(true);
        
        console.log('ðŸ“¥ Starting to load dashboard data...');
        
        // Check if we have auth token
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) {
            console.error('âŒ No auth token found - redirecting to login');
            logout();
            return;
        }
        
        console.log('âœ… Token found, loading data...');
        
        // Load students with better error handling
        try {
            console.log('Fetching students...');
            const studentsResponse = await fetch('/api/students', { 
                headers: authHeaders(),
                method: 'GET'
            });
            
            console.log('Students response status:', studentsResponse.status);
            
            if (studentsResponse.status === 401 || studentsResponse.status === 403) {
                console.error('âŒ Authentication failed - token may be invalid');
                showToast('Session expired. Please login again.', 'error');
                logout();
                return;
            }
            
            if (studentsResponse.ok) {
                const studentsData = await studentsResponse.json();
                students = Array.isArray(studentsData) ? studentsData.map(normalizeStudent) : [];
                console.log('âœ… Loaded students:', students.length);
            } else {
                const errorText = await studentsResponse.text();
                console.error('âŒ Failed to load students:', studentsResponse.status, errorText);
                students = [];
            }
        } catch (err) {
            console.error('âŒ Error loading students:', err);
            students = [];
        }
        
        // Load fees with better error handling
        try {
            console.log('Fetching fees...');
            const feesResponse = await fetch('/api/fees', { 
                headers: authHeaders(),
                method: 'GET'
            });
            
            console.log('Fees response status:', feesResponse.status);
            
            if (feesResponse.ok) {
                const feesData = await feesResponse.json();
                fees = Array.isArray(feesData) ? feesData.map(normalizeFee) : [];
                console.log('âœ… Loaded fees:', fees.length);
            } else {
                const errorText = await feesResponse.text();
                console.error('âŒ Failed to load fees:', feesResponse.status, errorText);
                fees = [];
            }
        } catch (err) {
            console.error('âŒ Error loading fees:', err);
            fees = [];
        }
        
        // Load teachers
        await loadTeachers();
        
        // Load grades
        await loadGrades();
        
        // Update the UI with loaded data
        console.log('ðŸ“Š Updating dashboard UI...');
        updateDashboardStats();
        populateStudentsTable();
        populateFeesTable();
        
        // Initialize charts after a brief delay
        setTimeout(() => {
            console.log('ðŸ“ˆ Initializing charts...');
            initCharts();
        }, 200);
        
        console.log('âœ… Dashboard data loaded successfully');
        showToast('Dashboard loaded successfully!', 'success');
        
    } catch (error) {
        console.error('âŒ Error loading dashboard data:', error);
        showToast('Error loading data. Please refresh the page.', 'error');
    } finally {
        showLoading(false);
    }
}

function normalizeStudent(student) {
    return {
        id: student.id,
        name: student.name,
        class: student.class || '',
        parent: student.parent_name || student.parent || '',
        parentPhone: student.parent_phone || student.parentPhone || '',
        email: student.email || '',
        phone: student.phone || '',
        dob: student.dob || null,
        address: student.address || '',
        status: student.status || 'Active'
    };
}

function normalizeFee(fee) {
    const totalPaid = fee.total_paid || 0;
    const balance = (fee.balance !== undefined) ? fee.balance : (parseFloat(fee.amount || 0) - totalPaid);
    
    return {
        id: fee.id,
        student: (fee.student && fee.student.name) || fee.student_id || '',
        studentId: fee.student_id || '',
        class: fee.class || '',
        amount: parseFloat(fee.amount || 0),
        totalPaid: totalPaid,
        balance: balance,
        dueDate: fee.due_date,
        status: fee.status || 'pending',
        payments: fee.payments || []
    };
}

async function loadTeachers() {
    try {
        console.log('Fetching teachers...');
        const response = await fetch('/api/teachers', { 
            headers: authHeaders(),
            method: 'GET'
        });
        
        if (response.ok) {
            const teachersData = await response.json();
            teachers = Array.isArray(teachersData) ? teachersData : [];
            console.log('âœ… Loaded teachers:', teachers.length);
        } else {
            console.error('âŒ Failed to load teachers');
            teachers = [];
        }
    } catch (error) {
        console.error('Error loading teachers:', error);
        teachers = [];
    }
}

async function loadGrades() {
    try {
        console.log('Fetching grades...');
        const response = await fetch('/api/grades', { 
            headers: authHeaders(),
            method: 'GET'
        });
        
        if (response.ok) {
            grades = await response.json();
            console.log('âœ… Loaded grades:', grades.length);
        } else {
            console.error('âŒ Failed to load grades');
            grades = [];
        }
    } catch (error) {
        console.error('Error loading grades:', error);
        grades = [];
    }
}

// Page navigation functions
function showSignupPage() {
    console.log('ðŸ“„ Showing signup page');
    elements.signupPage.style.display = 'flex';
    elements.loginPage.style.display = 'none';
    elements.dashboard.style.display = 'none';
}

function showLoginPage() {
    console.log('ðŸ“„ Showing login page');
    elements.signupPage.style.display = 'none';
    elements.loginPage.style.display = 'flex';
    elements.dashboard.style.display = 'none';
}

function showDashboard() {
    console.log('ðŸ“„ Showing dashboard');
    elements.signupPage.style.display = 'none';
    elements.loginPage.style.display = 'none';
    elements.dashboard.style.display = 'block';
    
    if (currentUser) {
        updateUserInterface();
        setRolePermissions();
    }
}

function updateUserInterface() {
    if (!currentUser) return;
    
    console.log('ðŸŽ¨ Updating user interface for:', currentUser.name);
    
    elements.roleBadge.textContent = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);
    elements.roleBadge.className = `role-badge ${currentUser.role}`;
    elements.userAvatar.textContent = currentUser.name.charAt(0).toUpperCase();
    elements.userName.textContent = currentUser.name;
    
    const pageTitle = document.querySelector('.page-title');
    if (pageTitle) {
        const titleText = pageTitle.textContent.split(' ')[0];
        pageTitle.innerHTML = `${titleText} <span class="role-badge ${currentUser.role}" id="roleBadge">${currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}</span>`;
    }
}

function updateDashboardStats() {
    console.log('ðŸ“Š Updating dashboard stats...');
    
    const totalStudentsElement = document.getElementById('totalStudents');
    if (totalStudentsElement) {
        totalStudentsElement.textContent = students.length;
    }
    
    const totalTeachersElement = document.getElementById('totalTeachers');
    if (totalTeachersElement) {
        totalTeachersElement.textContent = teachers.length;
    }
    
    const totalFeesElement = document.getElementById('totalFees');
    if (totalFeesElement) {
        totalFeesElement.textContent = calculateTotalFees();
    }
    
    if (enrollmentChart) {
        const enrollmentData = enrollmentChart.data.datasets[0].data;
        enrollmentData[enrollmentData.length - 1] = students.length;
        enrollmentChart.update();
    }
    
    if (feeChart) {
        const totalCollected = fees.reduce((sum, fee) => sum + (fee.totalPaid || 0), 0);
        const feeData = feeChart.data.datasets[0].data;
        feeData[feeData.length - 1] = Math.round(totalCollected);
        feeChart.update();
    }
}

function calculateTotalFees() {
    const total = fees.reduce((sum, fee) => {
        return sum + (fee.totalPaid || 0);
    }, 0);
    
    return formatCurrency(total);
}

function populateStudentsTable(filteredStudents = null) {
    if (!elements.studentsTableBody) {
        console.warn('âš ï¸ Students table body not found');
        return;
    }
    
    const studentsToDisplay = filteredStudents || students;
    
    console.log('ðŸ“ Populating students table with', studentsToDisplay.length, 'students');
    
    elements.studentsTableBody.innerHTML = '';
    
    if (studentsToDisplay.length === 0) {
        elements.studentsTableBody.innerHTML = '<tr><td colspan="7" class="text-center">No students found</td></tr>';
        return;
    }
    
    studentsToDisplay.slice(0, 10).forEach(student => {
        const row = document.createElement('tr');
        
        let statusClass = 'paid';
        if (student.status === 'Inactive') statusClass = 'pending';
        if (student.status === 'Pending') statusClass = 'overdue';
        
        row.innerHTML = `
            <td>${student.id}</td>
            <td>${student.name}</td>
            <td>${student.class}</td>
            <td>${student.parent}</td>
            <td>${student.email}</td>
            <td><span class="status ${statusClass}">${student.status}</span></td>
            <td>
                <button class="action-btn outline view-student" style="margin-right: 5px;">View</button>
                ${currentUser && currentUser.role === 'admin' ? 
                    `<button class="action-btn" style="background: #dc3545;" onclick="confirmDeleteStudent('${student.id}', '${student.name.replace(/'/g, "\\'")}')">Delete</button>` 
                    : ''}
            </td>
        `;
        
        elements.studentsTableBody.appendChild(row);
    });
}

function populateFeesTable() {
    if (!elements.feeTableBody) {
        console.warn('âš ï¸ Fee table body not found');
        return;
    }
    
    console.log('ðŸ“ Populating fees table with', fees.length, 'fees');
    
    elements.feeTableBody.innerHTML = '';
    
    if (fees.length === 0) {
        elements.feeTableBody.innerHTML = '<tr><td colspan="9" class="text-center">No fee records found</td></tr>';
        return;
    }
    
    fees.slice(0, 10).forEach(fee => {
        const row = document.createElement('tr');
        
        let statusClass = fee.status;
        if (fee.balance > 0 && fee.balance < fee.amount) {
            statusClass = 'partial';
        }
        
        row.innerHTML = `
            <td>${fee.id}</td>
            <td>${fee.student}</td>
            <td>${fee.class}</td>
            <td>${formatCurrency(fee.amount)}</td>
            <td>${formatCurrency(fee.totalPaid)}</td>
            <td><strong>${formatCurrency(fee.balance)}</strong></td>
            <td>${formatDate(fee.dueDate)}</td>
            <td><span class="status ${statusClass}">${fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}</span></td>
            <td>
                <button class="action-btn pay-fee" ${fee.balance <= 0 ? 'disabled' : ''} data-fee-id="${fee.id}">
                    ${fee.balance <= 0 ? 'Paid' : fee.totalPaid > 0 ? 'Pay Balance' : 'Pay'}
                </button>
            </td>
        `;
        
        elements.feeTableBody.appendChild(row);
    });
}

function showToast(message, type = 'info') {
    if (!elements.toastNotification || !elements.toastMessage || !elements.toastIcon) return;
    
    console.log(`ðŸ”” Toast: ${type} - ${message}`);
    
    elements.toastMessage.textContent = message;
    elements.toastNotification.className = `toast ${type}`;
    
    let iconClass = 'fas fa-info-circle';
    switch (type) {
        case 'success':
            iconClass = 'fas fa-check-circle';
            break;
        case 'error':
            iconClass = 'fas fa-exclamation-circle';
            break;
        case 'warning':
            iconClass = 'fas fa-exclamation-triangle';
            break;
        default:
            iconClass = 'fas fa-info-circle';
    }
    
    elements.toastIcon.className = iconClass;
    elements.toastNotification.classList.add('show');
    
    setTimeout(() => {
        elements.toastNotification.classList.remove('show');
    }, 4000);
}





// Student management functions
async function handleAddStudent(e) {
    e.preventDefault();
    
    clearFormErrors('studentForm');
    const saveBtn = document.getElementById('saveStudentBtn');
    setButtonLoading(saveBtn, true);
    
    const formData = {
        name: document.getElementById('studentName').value.trim(),
        email: document.getElementById('studentEmail').value.trim(),
        phone: document.getElementById('studentPhone').value.trim(),
        dob: document.getElementById('studentDOB').value,
        class: document.getElementById('studentClass').value,
        parent_name: document.getElementById('parentName').value.trim(),
        parent_phone: document.getElementById('parentPhone').value.trim(),
        address: document.getElementById('studentAddress').value.trim()
    };
    
    let hasErrors = false;
    
    if (!formData.name) {
        showFieldError('studentName', 'Student name is required');
        hasErrors = true;
    }
    
    if (formData.email && !validateEmail(formData.email)) {
        showFieldError('studentEmail', 'Please enter a valid email address');
        hasErrors = true;
    }
    
    if (hasErrors) {
        setButtonLoading(saveBtn, false);
        return;
    }
    
    try {
        const response = await fetch('/api/students', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            const newStudent = await response.json();
            students.unshift(normalizeStudent(newStudent));
            
            document.getElementById('studentForm').reset();
            clearFormErrors('studentForm');
            
            const classFilter = document.getElementById('classFilter');
            if (classFilter) {
                const uniqueClasses = [...new Set(students.map(s => s.class).filter(c => c))].sort();
                classFilter.innerHTML = `
                    <option value="all">All Classes (${students.length})</option>
                    ${uniqueClasses.map(cls => {
                        const count = students.filter(s => s.class === cls).length;
                        return `<option value="${cls}">${cls} (${count})</option>`;
                    }).join('')}
                `;
            }
            
            populateStudentsTable();
            
            const viewAllElement = document.querySelector('.section-title + div .view-all');
            if (viewAllElement) {
                viewAllElement.textContent = `Total: ${students.length}`;
            }
            
            updateDashboardStats();
            
            showToast(`Student ${newStudent.name} added successfully! Fee invoice created automatically.`, 'success');
        } else {
            const error = await response.json();
            showToast(error.message || 'Failed to add student', 'error');
        }
    } catch (error) {
        console.error('Error adding student:', error);
        showToast('Network error. Please try again.', 'error');
    } finally {
        setButtonLoading(saveBtn, false);
    }
}



function filterStudentsByClass(className) {
    if (className === 'all') {
        populateStudentsTable();
        return;
    }
    
    const filtered = students.filter(s => s.class === className);
    populateStudentsTable(filtered);
    
    const viewAllElement = document.querySelector('.section-title + div .view-all');
    if (viewAllElement) {
        viewAllElement.textContent = `Showing: ${filtered.length} of ${students.length}`;
    }
}

function showStudentDetails(studentId) {
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    
    const modalBody = document.querySelector('#studentModal .modal-body');
    
    modalBody.innerHTML = `
        <div class="student-profile">
            <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 20px;">
                <div class="user-avatar" style="width: 80px; height: 80px; font-size: 24px;">${student.name.charAt(0)}</div>
                <div>
                    <h2 style="margin-bottom: 5px;">${student.name}</h2>
                    <p>Student ID: ${student.id}</p>
                    <p>${student.class}</p>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Date of Birth</label>
                    <p>${student.dob ? formatDate(student.dob) : 'N/A'}</p>
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <p>${student.email || 'N/A'}</p>
                </div>
                <div class="form-group">
                    <label>Phone</label>
                    <p>${student.phone || 'N/A'}</p>
                </div>
                <div class="form-group">
                    <label>Parent/Guardian</label>
                    <p>${student.parent || 'N/A'}</p>
                </div>
                <div class="form-group">
                    <label>Parent Phone</label>
                    <p>${student.parentPhone || 'N/A'}</p>
                </div>
                <div class="form-group">
                    <label>Address</label>
                    <p>${student.address || 'N/A'}</p>
                </div>
            </div>
            
            <div class="section-header" style="margin-top: 20px;">
                <div class="section-title">Academic Information</div>
            </div>
            
            <table style="width: 100%; margin-top: 10px;">
                <thead>
                    <tr>
                        <th>Subject</th>
                        <th>Grade</th>
                        <th>Attendance</th>
                        <th>Teacher</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Mathematics</td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                    <tr>
                        <td>English</td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                    <tr>
                        <td>Science</td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                    <tr>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
    
    showModal('studentModal');
}

// Fee management functions with balance tracking


function filterFees(filter) {
    let filteredFees = fees;
    
    if (filter !== 'all') {
        filteredFees = fees.filter(fee => {
            if (filter === 'pending') {
                return fee.status === 'pending' || fee.status === 'partial';
            }
            return fee.status === filter;
        });
    }
    
    if (!elements.feeTableBody) return;
    
    elements.feeTableBody.innerHTML = '';
    
    if (filteredFees.length === 0) {
        elements.feeTableBody.innerHTML = '<tr><td colspan="9" class="text-center">No records found</td></tr>';
        return;
    }
    
    filteredFees.forEach(fee => {
        const row = document.createElement('tr');
        
        let statusClass = fee.status;
        if (fee.balance > 0 && fee.balance < fee.amount) {
            statusClass = 'partial';
        }
        
        row.innerHTML = `
            <td>${fee.id}</td>
            <td>${fee.student}</td>
            <td>${fee.class}</td>
            <td>${formatCurrency(fee.amount)}</td>
            <td>${formatCurrency(fee.totalPaid)}</td>
            <td><strong>${formatCurrency(fee.balance)}</strong></td>
            <td>${formatDate(fee.dueDate)}</td>
            <td><span class="status ${statusClass}">${fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}</span></td>
            <td>
                <button class="action-btn pay-fee" ${fee.balance <= 0 ? 'disabled' : ''} data-fee-id="${fee.id}">
                    ${fee.balance <= 0 ? 'Paid' : fee.totalPaid > 0 ? 'Pay Balance' : 'Pay'}
                </button>
            </td>
        `;
        
        elements.feeTableBody.appendChild(row);
    });
}

function showPaymentForm(feeId) {
    const fee = fees.find(f => f.id === feeId);
    if (!fee) return;
    
    const modalBody = document.querySelector('#paymentModal .modal-body');
    
    const balanceAmount = fee.balance || (fee.amount - (fee.totalPaid || 0));
    const hasPreviousPayments = fee.totalPaid > 0;
    
    modalBody.innerHTML = `
        <div class="form-group">
            <label>Invoice ID</label>
            <p><strong>${fee.id}</strong></p>
        </div>
        <div class="form-group">
            <label>Student</label>
            <p><strong>${fee.student}</strong> (${fee.class})</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                <div>
                    <div class="receipt-label">Total Amount</div>
                    <div style="font-size: 18px; font-weight: 600; color: var(--primary);">${formatCurrency(fee.amount)}</div>
                </div>
                <div>
                    <div class="receipt-label">Paid So Far</div>
                    <div style="font-size: 18px; font-weight: 600; color: var(--success);">${formatCurrency(fee.totalPaid || 0)}</div>
                </div>
                <div>
                    <div class="receipt-label">Balance Due</div>
                    <div style="font-size: 18px; font-weight: 600; color: ${balanceAmount > 0 ? 'var(--error)' : 'var(--success)'};">${formatCurrency(balanceAmount)}</div>
                </div>
            </div>
        </div>
        
        ${hasPreviousPayments ? `
            <div class="form-group">
                <label>Previous Payments</label>
                <div style="max-height: 120px; overflow-y: auto; border: 1px solid var(--light-gray); border-radius: 8px; padding: 10px;">
                    ${(fee.payments || []).map(payment => `
                        <div style="padding: 8px; border-bottom: 1px solid var(--light-gray); display: flex; justify-content: space-between;">
                            <span>${formatDate(payment.payment_date)} - ${payment.method || 'N/A'}</span>
                            <strong>${formatCurrency(payment.amount)}</strong>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
        
        <div class="form-group">
            <label for="paymentAmount">Payment Amount (GHS) *</label>
            <input type="number" id="paymentAmount" class="form-control" 
                value="${balanceAmount.toFixed(2)}" 
                max="${balanceAmount.toFixed(2)}"
                step="0.01" min="0.01" required>
            <span class="error-message" id="paymentAmountError"></span>
            <small style="color: var(--gray); margin-top: 5px; display: block;">
                Maximum payable: ${formatCurrency(balanceAmount)}
            </small>
        </div>
        
        <div class="form-group">
            <label for="paymentMethod">Payment Method *</label>
            <select id="paymentMethod" class="form-control" required>
                <option value="">Select Method</option>
                <option value="cash">Cash</option>
                <option value="check">Check</option>
                <option value="credit">Credit Card</option>
                <option value="bank">Bank Transfer</option>
                <option value="mobile">Mobile Money</option>
            </select>
            <span class="error-message" id="paymentMethodError"></span>
        </div>
        
        <div class="form-group">
            <label for="paymentDate">Payment Date *</label>
            <input type="date" id="paymentDate" class="form-control" 
                value="${new Date().toISOString().split('T')[0]}" 
                max="${new Date().toISOString().split('T')[0]}"
                required>
            <span class="error-message" id="paymentDateError"></span>
        </div>
        
        <div class="form-group">
            <label for="paymentNotes">Notes</label>
            <textarea id="paymentNotes" class="form-control" rows="3" placeholder="Enter any additional notes"></textarea>
            <span class="error-message" id="paymentNotesError"></span>
        </div>
    `;
    
    showModal('paymentModal');
}

async function handlePayment() {
    const paymentAmountField = document.getElementById('paymentAmount');
    const paymentMethodField = document.getElementById('paymentMethod');
    const paymentDateField = document.getElementById('paymentDate');
    const paymentNotesField = document.getElementById('paymentNotes');
    
    if (!paymentAmountField || !paymentMethodField || !paymentDateField) return;
    
    document.querySelectorAll('#paymentModal .error-message').forEach(el => el.textContent = '');
    document.querySelectorAll('#paymentModal .form-control.error').forEach(el => el.classList.remove('error'));
    
    const confirmBtn = document.getElementById('confirmPayment');
    setButtonLoading(confirmBtn, true);
    
    const feeId = document.querySelector('#paymentModal .modal-body p strong').textContent.trim();
    const fee = fees.find(f => f.id === feeId);
    
    if (!fee) {
        showToast('Fee record not found', 'error');
        setButtonLoading(confirmBtn, false);
        return;
    }
    
    const paymentAmount = parseFloat(paymentAmountField.value);
    const balance = fee.balance || (fee.amount - (fee.totalPaid || 0));
    
    const formData = {
        fee_id: feeId,
        amount: paymentAmount,
        method: paymentMethodField.value,
        payment_date: paymentDateField.value,
        notes: paymentNotesField.value.trim()
    };
    
    let hasErrors = false;
    
    if (!formData.amount || formData.amount <= 0) {
        paymentAmountField.classList.add('error');
        document.getElementById('paymentAmountError').textContent = 'Please enter a valid amount';
        hasErrors = true;
    } else if (formData.amount > balance) {
        paymentAmountField.classList.add('error');
        document.getElementById('paymentAmountError').textContent = `Amount cannot exceed balance of ${formatCurrency(balance)}`;
        hasErrors = true;
    }
    
    if (!formData.method) {
        paymentMethodField.classList.add('error');
        document.getElementById('paymentMethodError').textContent = 'Please select a payment method';
        hasErrors = true;
    }
    
    if (!formData.payment_date) {
        paymentDateField.classList.add('error');
        document.getElementById('paymentDateError').textContent = 'Please select a payment date';
        hasErrors = true;
    }
    
    if (hasErrors) {
        setButtonLoading(confirmBtn, false);
        return;
    }
    
    try {
        const response = await fetch('/api/payments', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success || response.ok) {
            const feeIndex = fees.findIndex(f => f.id === formData.fee_id);
            if (feeIndex !== -1) {
                fees[feeIndex].totalPaid = result.total_paid || (fees[feeIndex].totalPaid + formData.amount);
                fees[feeIndex].balance = result.balance || 0;
                fees[feeIndex].status = result.status || (result.balance === 0 ? 'paid' : 'partial');
                
                if (!fees[feeIndex].payments) fees[feeIndex].payments = [];
                fees[feeIndex].payments.push({
                    amount: formData.amount,
                    method: formData.method,
                    payment_date: formData.payment_date,
                    notes: formData.notes
                });
            }
            
            populateFeesTable();
            updateDashboardStats();
            
            hideModal('paymentModal');
            
            showEnhancedReceipt(formData.fee_id, result.receiptNumber, formData.amount, result.balance);
            
            showToast(
                `Payment of ${formatCurrency(formData.amount)} recorded successfully! ${result.balance > 0 ? `Remaining balance: ${formatCurrency(result.balance)}` : 'Fee fully paid!'}`, 
                'success'
            );
        } else {
            showToast(result.message || 'Payment failed', 'error');
        }
    } catch (error) {
        console.error('Payment error:', error);
        showToast('Network error. Please try again.', 'error');
    } finally {
        setButtonLoading(confirmBtn, false);
    }
}

// Enhanced receipt with balance information
function showEnhancedReceipt(feeId, receiptNumber, paidAmount, remainingBalance) {
    const fee = fees.find(f => f.id === feeId);
    if (!fee) return;
    
    let receiptSection = document.getElementById('receiptSection');
    
    if (!receiptSection) {
        showToast('Receipt generated successfully!', 'success');
        return;
    }
    
    const receiptNumberEl = document.getElementById('receiptNumber');
    const receiptDateEl = document.getElementById('receiptDate');
    const issuedByEl = document.getElementById('issuedBy');
    const studentReceiptNameEl = document.getElementById('studentReceiptName');
    const studentReceiptIdEl = document.getElementById('studentReceiptId');
    const studentReceiptClassEl = document.getElementById('studentReceiptClass');
    const receiptTableBody = document.getElementById('receiptTableBody');
    const receiptTotalEl = document.getElementById('receiptTotal');
    
    if (receiptNumberEl) receiptNumberEl.textContent = receiptNumber || '#RC' + Date.now().toString().slice(-8);
    if (receiptDateEl) receiptDateEl.textContent = formatDate(new Date());
    if (issuedByEl) issuedByEl.textContent = currentUser.name;
    if (studentReceiptNameEl) studentReceiptNameEl.textContent = fee.student;
    if (studentReceiptIdEl) studentReceiptIdEl.textContent = fee.studentId || fee.id.replace('INV', 'ST');
    if (studentReceiptClassEl) studentReceiptClassEl.textContent = fee.class;
    
    if (receiptTableBody) {
        receiptTableBody.innerHTML = `
            <tr>
                <td>Invoice ID</td>
                <td>${fee.id}</td>
            </tr>
            <tr>
                <td>Total Fee Amount</td>
                <td>${formatCurrency(fee.amount)}</td>
            </tr>
            <tr>
                <td>Previous Payments</td>
                <td>${formatCurrency((fee.totalPaid || 0) - paidAmount)}</td>
            </tr>
            <tr style="background: #f8f9fa; font-weight: 600;">
                <td>This Payment</td>
                <td>${formatCurrency(paidAmount)}</td>
            </tr>
            <tr style="background: #f8f9fa; font-weight: 600;">
                <td>Total Paid</td>
                <td>${formatCurrency(fee.totalPaid || paidAmount)}</td>
            </tr>
            <tr style="color: ${remainingBalance > 0 ? 'var(--error)' : 'var(--success)'}; font-weight: 600;">
                <td>Balance Due</td>
                <td>${formatCurrency(remainingBalance)}</td>
            </tr>
        `;
    }
    
    if (receiptTotalEl) {
        receiptTotalEl.innerHTML = `
            <div>Paid: ${formatCurrency(paidAmount)}</div>
            ${remainingBalance > 0 ? `<div style="color: var(--error); margin-top: 5px;">Balance: ${formatCurrency(remainingBalance)}</div>` : '<div style="color: var(--success); margin-top: 5px;">Fully Paid</div>'}
        `;
    }
    
    receiptSection.style.display = 'block';
    receiptSection.scrollIntoView({ behavior: 'smooth' });
}

function printReceipt() {
    const receiptContent = elements.receiptSection.cloneNode(true);
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Receipt - G & J Schools</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .receipt { max-width: 600px; margin: 0 auto; }
                .receipt-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #ccc; padding-bottom: 20px; }
                .receipt-title { font-size: 24px; margin-bottom: 5px; }
                .receipt-details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
                .receipt-item { margin-bottom: 15px; }
                .receipt-label { font-weight: bold; margin-bottom: 5px; }
                .receipt-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                .receipt-table th, .receipt-table td { padding: 10px; text-align: left; border-bottom: 1px solid #ccc; }
                .receipt-table th { background: #f5f5f5; }
                .receipt-total { text-align: right; font-size: 18px; font-weight: bold; margin-bottom: 30px; padding: 15px; background: #f5f5f5; }
                .receipt-footer { text-align: center; border-top: 2px solid #ccc; padding-top: 20px; color: #666; }
                .form-actions { display: none; }
            </style>
        </head>
        <body>
            ${receiptContent.innerHTML}
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
}

// Utility functions


function calculateTotalFees() {
    const total = fees.reduce((sum, fee) => {
        return sum + (fee.totalPaid || 0);
    }, 0);
    
    return formatCurrency(total);
}

function handleGlobalSearch(e) {
    if (e.key === 'Enter') {
        const searchTerm = e.target.value.toLowerCase().trim();
        if (searchTerm) {
            searchStudentsAndFees(searchTerm);
        } else {
            populateStudentsTable();
            populateFeesTable();
        }
    }
}

function searchStudentsAndFees(searchTerm) {
    const filteredStudents = students.filter(student => 
        student.name.toLowerCase().includes(searchTerm) ||
        student.id.toLowerCase().includes(searchTerm) ||
        student.email.toLowerCase().includes(searchTerm) ||
        student.class.toLowerCase().includes(searchTerm)
    );
    
    if (elements.studentsTableBody) {
        elements.studentsTableBody.innerHTML = '';
        
        if (filteredStudents.length === 0) {
            elements.studentsTableBody.innerHTML = '<tr><td colspan="7" class="text-center">No students found</td></tr>';
        } else {
            filteredStudents.forEach(student => {
                const row = document.createElement('tr');
                let statusClass = 'paid';
                if (student.status === 'Inactive') statusClass = 'pending';
                if (student.status === 'Pending') statusClass = 'overdue';
                
                row.innerHTML = `
                    <td>${student.id}</td>
                    <td>${student.name}</td>
                    <td>${student.class}</td>
                    <td>${student.parent}</td>
                    <td>${student.email}</td>
                    <td><span class="status ${statusClass}">${student.status}</span></td>
                    <td><button class="action-btn outline view-student">View</button></td>
                `;
                
                elements.studentsTableBody.appendChild(row);
            });
        }
    }
    
    showToast(`Found ${filteredStudents.length} student(s) matching "${searchTerm}"`, 'info');
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function showToast(message, type = 'info') {
    if (!elements.toastNotification || !elements.toastMessage || !elements.toastIcon) return;
    
    elements.toastMessage.textContent = message;
    elements.toastNotification.className = `toast ${type}`;
    
    let iconClass = 'fas fa-info-circle';
    switch (type) {
        case 'success':
            iconClass = 'fas fa-check-circle';
            break;
        case 'error':
            iconClass = 'fas fa-exclamation-circle';
            break;
        case 'warning':
            iconClass = 'fas fa-exclamation-triangle';
            break;
        default:
            iconClass = 'fas fa-info-circle';
    }
    
    elements.toastIcon.className = iconClass;
    elements.toastNotification.classList.add('show');
    
    setTimeout(() => {
        elements.toastNotification.classList.remove('show');
    }, 4000);
}

function setRolePermissions() {
    if (!currentUser) return;
    
    const addStudentForm = document.getElementById('addStudentForm');
    
    if (currentUser.role === 'teacher') {
        if (addStudentForm) {
            addStudentForm.style.display = 'none';
        }
        
        const payButtons = document.querySelectorAll('.pay-fee');
        payButtons.forEach(button => {
            button.disabled = true;
            button.classList.add('disabled');
            button.textContent = 'View Only';
        });
    } else {
        if (addStudentForm) {
            addStudentForm.style.display = 'block';
        }
        
        const payButtons = document.querySelectorAll('.pay-fee');
        payButtons.forEach(button => {
            const row = button.closest('tr');
            if (row) {
                const balanceCell = row.cells[5];
                if (balanceCell) {
                    const balanceText = balanceCell.textContent.replace(/[^\d.]/g, '');
                    const balance = parseFloat(balanceText);
                    
                    if (balance <= 0) {
                        button.disabled = true;
                        button.textContent = 'Paid';
                    } else {
                        button.disabled = false;
                        button.classList.remove('disabled');
                    }
                }
            }
        });
    }
}

// Chart initialization
function initCharts() {
    initEnrollmentChart();
    initFeeChart();
}

function initEnrollmentChart() {
    const ctx = document.getElementById('enrollmentChart');
    if (!ctx) return;
    
    if (enrollmentChart) {
        enrollmentChart.destroy();
    }
    
    enrollmentChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: '2025 Enrollment',
                data: [120, 190, 150, 200, 180, 220, 250, 280, 300, 320, 350, students.length],
                borderColor: '#4361ee',
                backgroundColor: 'rgba(67, 97, 238, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        drawBorder: false
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function initFeeChart() {
    const ctx = document.getElementById('feeChart');
    if (!ctx) return;
    
    if (feeChart) {
        feeChart.destroy();
    }
    
    const totalCollected = fees.reduce((sum, fee) => sum + (fee.totalPaid || 0), 0);
    
    feeChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
            datasets: [{
                label: 'Fee Collection (in GHS)',
                data: [12500, 14200, 11800, 15600, 17200, 16500, Math.round(totalCollected)],
                backgroundColor: 'rgba(76, 201, 240, 0.6)',
                borderColor: 'rgba(76, 201, 240, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        drawBorder: false
                    },
                    ticks: {
                        callback: function(value) {
                            return 'GHS ' + value.toLocaleString();
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Teachers Management
async function loadTeachers() {
    try {
        const response = await fetch('/api/teachers', { headers: authHeaders() });
        if (response.ok) {
            const teachersData = await response.json();
            teachers = teachersData;
        }
    } catch (error) {
        console.error('Error loading teachers:', error);
    }
}

function showTeachersContent() {
    elements.contentArea.innerHTML = `
        <div class="form-container" id="addTeacherForm">
            <div class="form-title">Add New Teacher</div>
            <form id="teacherForm" novalidate>
                <div class="form-row">
                    <div class="form-group">
                        <label for="teacherName">Full Name *</label>
                        <input type="text" id="teacherName" class="form-control" placeholder="Enter full name" required>
                        <span class="error-message" id="teacherNameError"></span>
                    </div>
                    <div class="form-group">
                        <label for="teacherEmail">Email Address *</label>
                        <input type="email" id="teacherEmail" class="form-control" placeholder="Enter email" required>
                        <span class="error-message" id="teacherEmailError"></span>
                    </div>
                    <div class="form-group">
                        <label for="teacherPhone">Phone Number</label>
                        <input type="tel" id="teacherPhone" class="form-control" placeholder="Enter phone number">
                        <span class="error-message" id="teacherPhoneError"></span>
                    </div>
                    <div class="form-group">
                        <label for="teacherSubject">Subject/Specialization *</label>
                        <select id="teacherSubject" class="form-control" required>
                            <option value="">Select Subject</option>
                            <option value="Mathematics">Mathematics</option>
                            <option value="English">English</option>
                            <option value="Science">Science</option>
                            <option value="Social Studies">Social Studies</option>
                            <option value="ICT">ICT</option>
                            <option value="Physical Education">Physical Education</option>
                            <option value="Art">Art</option>
                            <option value="Music">Music</option>
                        </select>
                        <span class="error-message" id="teacherSubjectError"></span>
                    </div>
                    <div class="form-group">
                        <label for="teacherQualification">Qualification</label>
                        <input type="text" id="teacherQualification" class="form-control" placeholder="e.g., BSc, MSc, PhD">
                        <span class="error-message" id="teacherQualificationError"></span>
                    </div>
                    <div class="form-group">
                        <label for="teacherExperience">Years of Experience</label>
                        <input type="number" id="teacherExperience" class="form-control" placeholder="0" min="0">
                        <span class="error-message" id="teacherExperienceError"></span>
                    </div>
                    <div class="form-group">
                        <label for="teacherSalary">Monthly Salary (GHS)</label>
                        <input type="number" id="teacherSalary" class="form-control" placeholder="0.00" step="0.01" min="0">
                        <span class="error-message" id="teacherSalaryError"></span>
                    </div>
                    <div class="form-group">
                        <label for="teacherStatus">Status</label>
                        <select id="teacherStatus" class="form-control">
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="On Leave">On Leave</option>
                        </select>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="action-btn outline" id="resetTeacherForm">Reset</button>
                    <button type="submit" class="action-btn" id="saveTeacherBtn">
                        <span class="btn-text">Add Teacher</span>
                        <span class="btn-spinner" style="display: none;"><i class="fas fa-spinner fa-spin"></i></span>
                    </button>
                </div>
            </form>
        </div>

        <div class="recent-section">
            <div class="section-header">
                <div class="section-title">All Teachers</div>
                <div class="view-all">Total: ${teachers.length}</div>
            </div>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Teacher ID</th>
                            <th>Name</th>
                            <th>Subject</th>
                            <th>Qualification</th>
                            <th>Experience</th>
                            <th>Contact</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody id="teachersTableBody"></tbody>
                </table>
            </div>
        </div>
    `;
    
    populateTeachersTable();
    
    const teacherForm = document.getElementById('teacherForm');
    if (teacherForm) {
        teacherForm.addEventListener('submit', handleAddTeacher);
    }
    
    const resetBtn = document.getElementById('resetTeacherForm');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            teacherForm.reset();
            clearFormErrors('teacherForm');
        });
    }
    
    setRolePermissions();
}

function populateTeachersTable() {
    const tbody = document.getElementById('teachersTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (teachers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No teachers found</td></tr>';
        return;
    }
    
    teachers.forEach(teacher => {
        const row = document.createElement('tr');
        
        let statusClass = 'paid';
        if (teacher.status === 'Inactive') statusClass = 'pending';
        if (teacher.status === 'On Leave') statusClass = 'overdue';
        
        row.innerHTML = `
            <td>${teacher.id}</td>
            <td>${teacher.name}</td>
            <td>${teacher.subject || 'N/A'}</td>
            <td>${teacher.qualification || 'N/A'}</td>
            <td>${teacher.experience || 0} years</td>
            <td>${teacher.email}</td>
            <td><span class="status ${statusClass}">${teacher.status}</span></td>
            <td>
                <button class="action-btn outline view-teacher" data-id="${teacher.id}" style="margin-right: 5px;">View</button>
                ${currentUser && currentUser.role === 'admin' ? 
                    `<button class="action-btn" style="background: #dc3545;" onclick="confirmDeleteTeacher('${teacher.id}', '${teacher.name.replace(/'/g, "\\'")}')">Delete</button>` 
                    : ''}
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    document.querySelectorAll('.view-teacher').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const teacherId = e.target.dataset.id;
            showTeacherDetails(teacherId);
        });
    });
}

async function handleAddTeacher(e) {
    e.preventDefault();
    
    clearFormErrors('teacherForm');
    const saveBtn = document.getElementById('saveTeacherBtn');
    setButtonLoading(saveBtn, true);
    
    const formData = {
        name: document.getElementById('teacherName').value.trim(),
        email: document.getElementById('teacherEmail').value.trim(),
        phone: document.getElementById('teacherPhone').value.trim(),
        subject: document.getElementById('teacherSubject').value,
        qualification: document.getElementById('teacherQualification').value.trim(),
        experience: parseInt(document.getElementById('teacherExperience').value) || 0,
        salary: parseFloat(document.getElementById('teacherSalary').value) || 0,
        status: document.getElementById('teacherStatus').value
    };
    
    let hasErrors = false;
    
    if (!formData.name) {
        showFieldError('teacherName', 'Teacher name is required');
        hasErrors = true;
    }
    
    if (!formData.email) {
        showFieldError('teacherEmail', 'Email is required');
        hasErrors = true;
    } else if (!validateEmail(formData.email)) {
        showFieldError('teacherEmail', 'Please enter a valid email address');
        hasErrors = true;
    }
    
    if (!formData.subject) {
        showFieldError('teacherSubject', 'Subject is required');
        hasErrors = true;
    }
    
    if (hasErrors) {
        setButtonLoading(saveBtn, false);
        return;
    }
    
    try {
        const response = await fetch('/api/teachers', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            const newTeacher = await response.json();
            teachers.unshift(newTeacher);
            
            document.getElementById('teacherForm').reset();
            clearFormErrors('teacherForm');
            populateTeachersTable();
            
            const viewAllElement = document.querySelector('.section-title + .view-all');
            if (viewAllElement) {
                viewAllElement.textContent = `Total: ${teachers.length}`;
            }
            
            updateDashboardStats();
            
            showToast(`Teacher ${newTeacher.name} added successfully!`, 'success');
        } else {
            const error = await response.json();
            showToast(error.message || 'Failed to add teacher', 'error');
        }
    } catch (error) {
        console.error('Error adding teacher:', error);
        showToast('Network error. Please try again.', 'error');
    } finally {
        setButtonLoading(saveBtn, false);
    }
}

function showTeacherDetails(teacherId) {
    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher) return;
    
    const modalBody = document.querySelector('#studentModal .modal-body');
    
    modalBody.innerHTML = `
        <div class="student-profile">
            <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 20px;">
                <div class="user-avatar" style="width: 80px; height: 80px; font-size: 24px;">${teacher.name.charAt(0)}</div>
                <div>
                    <h2 style="margin-bottom: 5px;">${teacher.name}</h2>
                    <p>Teacher ID: ${teacher.id}</p>
                    <p>${teacher.subject || 'N/A'}</p>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Email</label>
                    <p>${teacher.email || 'N/A'}</p>
                </div>
                <div class="form-group">
                    <label>Phone</label>
                    <p>${teacher.phone || 'N/A'}</p>
                </div>
                <div class="form-group">
                    <label>Subject</label>
                    <p>${teacher.subject || 'N/A'}</p>
                </div>
                <div class="form-group">
                    <label>Qualification</label>
                    <p>${teacher.qualification || 'N/A'}</p>
                </div>
                <div class="form-group">
                    <label>Experience</label>
                    <p>${teacher.experience || 0} years</p>
                </div>
                <div class="form-group">
                    <label>Monthly Salary</label>
                    <p>${formatCurrency(teacher.salary || 0)}</p>
                </div>
                <div class="form-group">
                    <label>Status</label>
                    <p><span class="status ${teacher.status === 'Active' ? 'paid' : 'pending'}">${teacher.status}</span></p>
                </div>
            </div>
        </div>
    `;
    
    showModal('studentModal');
}

// Academic/Grades Management
async function loadGrades() {
    try {
        const response = await fetch('/api/grades', { headers: authHeaders() });
        if (response.ok) {
            grades = await response.json();
        }
    } catch (error) {
        console.error('Error loading grades:', error);
    }
}

function showAcademicContent() {
    elements.contentArea.innerHTML = `
        <div class="form-container">
            <div class="form-title">Record Student Grade</div>
            <form id="gradeForm" novalidate>
                <div class="form-row">
                    <div class="form-group">
                        <label for="gradeStudent">Student *</label>
                        <select id="gradeStudent" class="form-control" required>
                            <option value="">Select Student</option>
                            ${students.map(s => `<option value="${s.id}">${s.name} (${s.class})</option>`).join('')}
                        </select>
                        <span class="error-message" id="gradeStudentError"></span>
                    </div>
                    <div class="form-group">
                        <label for="gradeSubject">Subject *</label>
                        <select id="gradeSubject" class="form-control" required>
                            <option value="">Select Subject</option>
                            <option value="Mathematics">Mathematics</option>
                            <option value="English">English</option>
                            <option value="Science">Science</option>
                            <option value="Social Studies">Social Studies</option>
                            <option value="ICT">ICT</option>
                        </select>
                        <span class="error-message" id="gradeSubjectError"></span>
                    </div>
                    <div class="form-group">
                        <label for="gradeValue">Grade *</label>
                        <select id="gradeValue" class="form-control" required>
                            <option value="">Select Grade</option>
                            <option value="A+">A+</option>
                            <option value="A">A</option>
                            <option value="B+">B+</option>
                            <option value="B">B</option>
                            <option value="C+">C+</option>
                            <option value="C">C</option>
                            <option value="D+">D+</option>
                            <option value="D">D</option>
                            <option value="F">F</option>
                        </select>
                        <span class="error-message" id="gradeValueError"></span>
                    </div>
                    <div class="form-group">
                        <label for="gradeTerm">Term *</label>
                        <select id="gradeTerm" class="form-control" required>
                            <option value="">Select Term</option>
                            <option value="Term 1">Term 1</option>
                            <option value="Term 2">Term 2</option>
                            <option value="Term 3">Term 3</option>
                        </select>
                        <span class="error-message" id="gradeTermError"></span>
                    </div>
                    <div class="form-group">
                        <label for="gradeYear">Academic Year *</label>
                        <input type="text" id="gradeYear" class="form-control" placeholder="2024/2025" value="2024/2025" required>
                        <span class="error-message" id="gradeYearError"></span>
                    </div>
                    <div class="form-group">
                        <label for="gradeRemarks">Remarks</label>
                        <textarea id="gradeRemarks" class="form-control" rows="2" placeholder="Teacher's comments"></textarea>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="action-btn outline" id="resetGradeForm">Reset</button>
                    <button type="submit" class="action-btn">
                        <span class="btn-text">Save Grade</span>
                        <span class="btn-spinner" style="display: none;"><i class="fas fa-spinner fa-spin"></i></span>
                    </button>
                </div>
            </form>
        </div>

        <div class="recent-section">
            <div class="section-header">
                <div class="section-title">Student Grades</div>
                <div class="view-all">Total: ${grades.length}</div>
            </div>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Class</th>
                            <th>Subject</th>
                            <th>Grade</th>
                            <th>Term</th>
                            <th>Academic Year</th>
                            <th>Remarks</th>
                        </tr>
                    </thead>
                    <tbody id="gradesTableBody"></tbody>
                </table>
            </div>
        </div>
    `;
    
    populateGradesTable();
    
    const gradeForm = document.getElementById('gradeForm');
    if (gradeForm) {
        gradeForm.addEventListener('submit', handleAddGrade);
    }
    
    const resetBtn = document.getElementById('resetGradeForm');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            gradeForm.reset();
            clearFormErrors('gradeForm');
        });
    }
}

function populateGradesTable() {
    const tbody = document.getElementById('gradesTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (grades.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No grades recorded yet</td></tr>';
        return;
    }
    
    grades.forEach(grade => {
        const row = document.createElement('tr');
        
        let gradeClass = 'paid';
        if (['B', 'B+', 'C', 'C+'].includes(grade.grade)) gradeClass = 'pending';
        if (['D', 'D+', 'F'].includes(grade.grade)) gradeClass = 'overdue';
        
        row.innerHTML = `
            <td>${grade.student_name || 'N/A'}</td>
            <td>${grade.class || 'N/A'}</td>
            <td>${grade.subject}</td>
            <td><span class="status ${gradeClass}">${grade.grade}</span></td>
            <td>${grade.term}</td>
            <td>${grade.academic_year}</td>
            <td>${grade.remarks || '-'}</td>
        `;
        
        tbody.appendChild(row);
    });
}

async function handleAddGrade(e) {
    e.preventDefault();
    
    const formData = {
        student_id: document.getElementById('gradeStudent').value,
        subject: document.getElementById('gradeSubject').value,
        grade: document.getElementById('gradeValue').value,
        term: document.getElementById('gradeTerm').value,
        academic_year: document.getElementById('gradeYear').value,
        remarks: document.getElementById('gradeRemarks').value.trim()
    };
    
    try {
        const response = await fetch('/api/grades', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            await loadGrades();
            document.getElementById('gradeForm').reset();
            populateGradesTable();
            
            const viewAllElement = document.querySelector('.section-title + .view-all');
            if (viewAllElement) {
                viewAllElement.textContent = `Total: ${grades.length}`;
            }
            
            updateDashboardStats();
            
            showToast('Grade recorded successfully!', 'success');
        } else {
            const error = await response.json();
            showToast(error.message || 'Failed to record grade', 'error');
        }
    } catch (error) {
        console.error('Error recording grade:', error);
        showToast('Network error. Please try again.', 'error');
    }
}

// Finance Dashboard
function showFinanceContent() {
    const paidFees = fees.filter(f => f.status === 'paid');
    const pendingFees = fees.filter(f => f.status === 'pending' || f.status === 'partial');
    const overdueFees = fees.filter(f => f.status === 'overdue');
    
    const totalCollected = fees.reduce((sum, f) => sum + (f.totalPaid || 0), 0);
    const totalPending = pendingFees.reduce((sum, f) => sum + (f.balance || f.amount), 0);
    const totalOverdue = overdueFees.reduce((sum, f) => sum + (f.balance || f.amount), 0);
    
    elements.contentArea.innerHTML = `
        <div class="dashboard-overview">
            <div class="stat-card fees">
                <div class="stat-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="stat-info">
                    <h3>${formatCurrency(totalCollected)}</h3>
                    <p>Total Collected</p>
                </div>
            </div>
            <div class="stat-card attendance">
                <div class="stat-icon">
                    <i class="fas fa-clock"></i>
                </div>
                <div class="stat-info">
                    <h3>${formatCurrency(totalPending)}</h3>
                    <p>Pending Payments</p>
                </div>
            </div>
            <div class="stat-card teachers">
                <div class="stat-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="stat-info">
                    <h3>${formatCurrency(totalOverdue)}</h3>
                    <p>Overdue Payments</p>
                </div>
            </div>
            <div class="stat-card students">
                <div class="stat-icon">
                    <i class="fas fa-chart-line"></i>
                </div>
                <div class="stat-info">
                    <h3>${fees.length > 0 ? Math.round((paidFees.length / fees.length) * 100) : 0}%</h3>
                    <p>Collection Rate</p>
                </div>
            </div>
        </div>

        <div class="chart-card" style="margin-bottom: 30px;">
            <div class="chart-header">
                <div class="chart-title">Monthly Collections</div>
            </div>
            <div class="chart-container">
                <canvas id="financeChart"></canvas>
            </div>
        </div>

        <div class="receipt" id="receiptSection" style="display: none;">
            <div class="receipt-header">
                <h2 class="receipt-title">G & J Schools</h2>
                <p class="receipt-subtitle">Official Fee Receipt</p>
            </div>
            
            <div class="receipt-details">
            <div>
                    <div class="receipt-item">
                        <div class="receipt-label">Receipt Number</div>
                        <div id="receiptNumber">#RC20250101001</div>
                    </div>
                    <div class="receipt-item">
                        <div class="receipt-label">Date</div>
                        <div id="receiptDate">January 1, 2025</div>
                    </div>
                    <div class="receipt-item">
                        <div class="receipt-label">Issued By</div>
                        <div id="issuedBy">Accountant Name</div>
                    </div>
                </div>
                <div>
                    <div class="receipt-item">
                        <div class="receipt-label">Student</div>
                        <div id="studentReceiptName">Student Name</div>
                    </div>
                    <div class="receipt-item">
                        <div class="receipt-label">Student ID</div>
                        <div id="studentReceiptId">#ST2025001</div>
                    </div>
                    <div class="receipt-item">
                        <div class="receipt-label">Class</div>
                        <div id="studentReceiptClass">Grade 8A</div>
                    </div>
                </div>
            </div>
            
            <table class="receipt-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody id="receiptTableBody">
                    <tr>
                        <td>Tuition Fee</td>
                        <td id="receiptAmount">GHS 450.00</td>
                    </tr>
                </tbody>
            </table>
            
            <div class="receipt-total" id="receiptTotal">
                <div class="receipt-label">Total:</div>
                <div>GHS 450.00</div>
            </div>
            
            <div class="receipt-footer">
                <p>Payment received with thanks. This is an official receipt.</p>
                <p>G & J School Management System</p>
            </div>
            
            <div class="form-actions" style="margin-top: 20px;">
                <button class="action-btn outline" id="closeReceiptFinance">Close</button>
                <button class="action-btn" id="printReceiptBtnFinance">
                    <i class="fas fa-print"></i> Print Receipt
                </button>
            </div>
        </div>

        <div class="recent-section">
            <div class="section-header">
                <div class="section-title">All Fee Records</div>
                <div style="display: flex; align-items: center; gap: 15px;">
                    <button class="action-btn" id="exportFeesBtn">
                        <i class="fas fa-file-excel"></i> Export to Excel
                    </button>
                    <div class="tabs">
                        <div class="tab active" data-tab="all">All (${fees.length})</div>
                        <div class="tab" data-tab="paid">Paid (${paidFees.length})</div>
                        <div class="tab" data-tab="pending">Pending (${pendingFees.length})</div>
                        <div class="tab" data-tab="overdue">Overdue (${overdueFees.length})</div>
                    </div>
                </div>
            </div>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Invoice ID</th>
                            <th>Student</th>
                            <th>Class</th>
                            <th>Amount</th>
                            <th>Paid</th>
                            <th>Balance</th>
                            <th>Due Date</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody id="feeTableBody"></tbody>
                </table>
            </div>
        </div>
    `;
    
    elements.feeTableBody = document.getElementById('feeTableBody');
    
    populateFeesTable();
    initializeTabs();
    
    const exportFeesBtn = document.getElementById('exportFeesBtn');
    if (exportFeesBtn) {
        exportFeesBtn.addEventListener('click', exportFeesToExcel);
    }
    
    const closeReceiptFinance = document.getElementById('closeReceiptFinance');
    const printReceiptBtnFinance = document.getElementById('printReceiptBtnFinance');
    
    if (closeReceiptFinance) {
        closeReceiptFinance.addEventListener('click', () => {
            const receiptSection = document.getElementById('receiptSection');
            if (receiptSection) receiptSection.style.display = 'none';
        });
    }
    
    if (printReceiptBtnFinance) {
        printReceiptBtnFinance.addEventListener('click', printReceipt);
    }
    
    setTimeout(() => {
        const ctx = document.getElementById('financeChart');
        if (ctx) {
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
                    datasets: [{
                        label: 'Collections (GHS)',
                        data: [12500, 14200, 11800, 15600, 17200, 16500, 18000, 19200, totalCollected],
                        borderColor: '#4cc9f0',
                        backgroundColor: 'rgba(76, 201, 240, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return 'GHS ' + value.toLocaleString();
                                }
                            }
                        }
                    }
                }
            });
        }
    }, 100);
}

// Reports Dashboard
function showReportsContent() {
    elements.contentArea.innerHTML = `
        <div class="recent-section">
            <div class="section-header">
                <div class="section-title">Generate Reports</div>
            </div>
            
            <div class="form-row" style="margin-bottom: 30px;">
                <div class="report-card" onclick="generateFinancialReport()" style="cursor: pointer; padding: 30px; background: white; border-radius: 12px; box-shadow: 0 5px 15px rgba(0,0,0,0.05); text-align: center;">
                    <i class="fas fa-file-invoice-dollar" style="font-size: 48px; color: var(--success); margin-bottom: 15px;"></i>
                    <h3>Financial Summary</h3>
                    <p style="color: var(--gray); margin-top: 10px;">View complete financial overview</p>
                </div>
                
                <div class="report-card" onclick="generateStudentReport()" style="cursor: pointer; padding: 30px; background: white; border-radius: 12px; box-shadow: 0 5px 15px rgba(0,0,0,0.05); text-align: center;">
                    <i class="fas fa-user-graduate" style="font-size: 48px; color: var(--primary); margin-bottom: 15px;"></i>
                    <h3>Student Report</h3>
                    <p style="color: var(--gray); margin-top: 10px;">List of all students with details</p>
                </div>
                
                <div class="report-card" onclick="generatePerformanceReport()" style="cursor: pointer; padding: 30px; background: white; border-radius: 12px; box-shadow: 0 5px 15px rgba(0,0,0,0.05); text-align: center;">
                    <i class="fas fa-chart-bar" style="font-size: 48px; color: var(--warning); margin-bottom: 15px;"></i>
                    <h3>Performance Report</h3>
                    <p style="color: var(--gray); margin-top: 10px;">Student academic performance</p>
                </div>
            </div>
        </div>

        <div class="recent-section" id="reportOutput" style="display: none;">
            <div class="section-header">
                <div class="section-title" id="reportTitle">Report Results</div>
                <button class="action-btn" onclick="printReport()">
                    <i class="fas fa-print"></i> Print Report
                </button>
            </div>
            <div id="reportContent"></div>
        </div>
    `;
}

function generateFinancialReport() {
    const totalCollected = fees.filter(f => f.status === 'paid').reduce((sum, f) => sum + (f.totalPaid || f.amount), 0);
    const totalPending = fees.filter(f => f.status === 'pending' || f.status === 'partial').reduce((sum, f) => sum + (f.balance || f.amount), 0);
    const totalOverdue = fees.filter(f => f.status === 'overdue').reduce((sum, f) => sum + (f.balance || f.amount), 0);
    
    const reportOutput = document.getElementById('reportOutput');
    const reportContent = document.getElementById('reportContent');
    const reportTitle = document.getElementById('reportTitle');
    
    reportTitle.textContent = 'Financial Summary Report';
    reportContent.innerHTML = `
        <div style="padding: 20px;">
            <h2 style="margin-bottom: 20px;">G & J Schools - Financial Report</h2>
            <p style="color: var(--gray); margin-bottom: 30px;">Generated on: ${formatDate(new Date())}</p>
            
            <div class="dashboard-overview" style="margin-bottom: 30px;">
                <div class="stat-card fees">
                    <div class="stat-info">
                        <h3>${formatCurrency(totalCollected)}</h3>
                        <p>Total Collected</p>
                    </div>
                </div>
                <div class="stat-card attendance">
                    <div class="stat-info">
                        <h3>${formatCurrency(totalPending)}</h3>
                        <p>Pending Payments</p>
                    </div>
                </div>
                <div class="stat-card teachers">
                    <div class="stat-info">
                        <h3>${formatCurrency(totalOverdue)}</h3>
                        <p>Overdue Payments</p>
                    </div>
                </div>
            </div>
            
            <table style="width: 100%;">
                <thead>
                    <tr>
                        <th>Invoice ID</th>
                        <th>Student</th>
                        <th>Amount</th>
                        <th>Paid</th>
                        <th>Balance</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${fees.map(f => `
                        <tr>
                            <td>${f.id}</td>
                            <td>${f.student}</td>
                            <td>${formatCurrency(f.amount)}</td>
                            <td>${formatCurrency(f.totalPaid || 0)}</td>
                            <td>${formatCurrency(f.balance || 0)}</td>
                            <td><span class="status ${f.status}">${f.status}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    reportOutput.style.display = 'block';
    reportOutput.scrollIntoView({ behavior: 'smooth' });
}

function generatePerformanceReport() {
    if (grades.length === 0) {
        showToast('No grade data available for performance report', 'warning');
        return;
    }
    
    const reportOutput = document.getElementById('reportOutput');
    const reportContent = document.getElementById('reportContent');
    const reportTitle = document.getElementById('reportTitle');
    
    reportTitle.textContent = 'Student Performance Report';
    reportContent.innerHTML = `
        <div style="padding: 20px;">
            <h2 style="margin-bottom: 20px;">G & J Schools - Performance Report</h2>
            <p style="color: var(--gray); margin-bottom: 30px;">Generated on: ${formatDate(new Date())}</p>
            <p style="margin-bottom: 20px;"><strong>Total Grades Recorded:</strong> ${grades.length}</p>
            
            <table style="width: 100%;">
                <thead>
                    <tr>
                        <th>Student</th>
                        <th>Class</th>
                        <th>Subject</th>
                        <th>Grade</th>
                        <th>Term</th>
                        <th>Remarks</th>
                    </tr>
                </thead>
                <tbody>
                    ${grades.map(g => `
                        <tr>
                            <td>${g.student_name || 'N/A'}</td>
                            <td>${g.class || 'N/A'}</td>
                            <td>${g.subject}</td>
                            <td><span class="status ${['A', 'A+'].includes(g.grade) ? 'paid' : ['B', 'B+', 'C'].includes(g.grade) ? 'pending' : 'overdue'}">${g.grade}</span></td>
                            <td>${g.term}</td>
                            <td>${g.remarks || '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    reportOutput.style.display = 'block';
    reportOutput.scrollIntoView({ behavior: 'smooth' });
}

function generateStudentReport() {
    const reportOutput = document.getElementById('reportOutput');
    const reportContent = document.getElementById('reportContent');
    const reportTitle = document.getElementById('reportTitle');
    
    reportTitle.textContent = 'Student List Report';
    reportContent.innerHTML = `
        <div style="padding: 20px;">
            <h2 style="margin-bottom: 20px;">G & J Schools - Student Report</h2>
            <p style="color: var(--gray); margin-bottom: 30px;">Generated on: ${formatDate(new Date())}</p>
            <p style="margin-bottom: 20px;"><strong>Total Students:</strong> ${students.length}</p>
            
            <table style="width: 100%;">
                <thead>
                    <tr>
                        <th>Student ID</th>
                        <th>Name</th>
                        <th>Class</th>
                        <th>Parent/Guardian</th>
                        <th>Contact</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${students.map(s => `
                        <tr>
                            <td>${s.id}</td>
                            <td>${s.name}</td>
                            <td>${s.class}</td>
                            <td>${s.parent}</td>
                            <td>${s.email}</td>
                            <td><span class="status ${s.status === 'Active' ? 'paid' : 'pending'}">${s.status}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    reportOutput.style.display = 'block';
    reportOutput.scrollIntoView({ behavior: 'smooth' });
}

function printReport() {
    const reportContent = document.getElementById('reportContent');
    if (!reportContent) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>G & J Schools Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
                th { background: #f5f5f5; font-weight: bold; }
                .status { padding: 5px 10px; border-radius: 20px; font-size: 12px; }
                .status.paid { background: rgba(40, 167, 69, 0.1); color: #28a745; }
                .status.pending { background: rgba(255, 193, 7, 0.1); color: #ffc107; }
                .status.overdue { background: rgba(220, 53, 69, 0.1); color: #dc3545; }
                .status.partial { background: rgba(255, 193, 7, 0.2); color: #ff9800; }
                @media print {
                    body { margin: 0; }
                    button { display: none; }
                }
            </style>
        </head>
        <body>
            ${reportContent.innerHTML}
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
}

// DELETE STUDENTS AND TEACHERS FUNCTIONALITY
function confirmDeleteStudent(studentId, studentName) {
    const modalHTML = `
        <div class="modal-overlay" id="deleteStudentModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;">
            <div style="max-width: 400px; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                <h3 style="color: #dc3545; margin-bottom: 15px;">ÃƒÂ¢Ã…Â¡ ÃƒÂ¯Ã‚Â¸Ã‚Â Confirm Deletion</h3>
                <p style="margin-bottom: 20px;">
                    Are you sure you want to delete student <strong>${studentName}</strong>?
                </p>
                <p style="color: #666; font-size: 0.9em; margin-bottom: 25px;">
                    This action cannot be undone. All associated fees and payment records will also be deleted.
                </p>
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button class="action-btn outline" onclick="closeDeleteModal()">Cancel</button>
                    <button class="action-btn" style="background: #dc3545;" onclick="deleteStudent('${studentId}')" id="deleteStudentConfirmBtn">
                        <span class="btn-text">Delete Student</span>
                        <span class="btn-spinner" style="display: none;"><i class="fas fa-spinner fa-spin"></i></span>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

async function deleteStudent(studentId) {
    const deleteBtn = document.getElementById('deleteStudentConfirmBtn');
    if (deleteBtn) {
        setButtonLoading(deleteBtn, true);
    }
    
    try {
        const response = await fetch(`/api/students/${studentId}`, {
            method: 'DELETE',
            headers: authHeaders()
        });
        
        if (response.ok) {
            const index = students.findIndex(s => s.id === studentId);
            if (index !== -1) {
                const deletedStudent = students.splice(index, 1)[0];
                
                fees = fees.filter(f => f.studentId !== studentId);
                
                populateStudentsTable();
                updateDashboardStats();
                
                const viewAllElement = document.querySelector('.section-title + div .view-all');
                if (viewAllElement) {
                    viewAllElement.textContent = `Total: ${students.length}`;
                }
                
                const classFilter = document.getElementById('classFilter');
                if (classFilter) {
                    const uniqueClasses = [...new Set(students.map(s => s.class).filter(c => c))].sort();
                    classFilter.innerHTML = `
                        <option value="all">All Classes (${students.length})</option>
                        ${uniqueClasses.map(cls => {
                            const count = students.filter(s => s.class === cls).length;
                            return `<option value="${cls}">${cls} (${count})</option>`;
                        }).join('')}
                    `;
                }
                
                showToast(`Student ${deletedStudent.name} deleted successfully`, 'success');
            }
            
            closeDeleteModal();
        } else {
            const error = await response.json();
            showToast(error.error || 'Failed to delete student', 'error');
            if (deleteBtn) {
                setButtonLoading(deleteBtn, false);
            }
        }
    } catch (error) {
        console.error('Delete student error:', error);
        showToast('Failed to delete student. Please try again.', 'error');
        if (deleteBtn) {
            setButtonLoading(deleteBtn, false);
        }
    }
}

function confirmDeleteTeacher(teacherId, teacherName) {
    const modalHTML = `
        <div class="modal-overlay" id="deleteTeacherModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;">
            <div style="max-width: 400px; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                <h3 style="color: #dc3545; margin-bottom: 15px;">ÃƒÂ¢Ã…Â¡ ÃƒÂ¯Ã‚Â¸Ã‚Â Confirm Deletion</h3>
                <p style="margin-bottom: 20px;">
                    Are you sure you want to delete teacher <strong>${teacherName}</strong>?
                </p>
                <p style="color: #666; font-size: 0.9em; margin-bottom: 25px;">
                    This action cannot be undone. All associated records will be removed.
                </p>
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button class="action-btn outline" onclick="closeDeleteModal()">Cancel</button>
                    <button class="action-btn" style="background: #dc3545;" onclick="deleteTeacher('${teacherId}')" id="deleteTeacherConfirmBtn">
                        <span class="btn-text">Delete Teacher</span>
                        <span class="btn-spinner" style="display: none;"><i class="fas fa-spinner fa-spin"></i></span>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

async function deleteTeacher(teacherId) {
    const deleteBtn = document.getElementById('deleteTeacherConfirmBtn');
    if (deleteBtn) {
        setButtonLoading(deleteBtn, true);
    }
    
    try {
        const response = await fetch(`/api/teachers/${teacherId}`, {
            method: 'DELETE',
            headers: authHeaders()
        });
        
        if (response.ok) {
            const index = teachers.findIndex(t => t.id === teacherId);
            if (index !== -1) {
                const deletedTeacher = teachers.splice(index, 1)[0];
                
                populateTeachersTable();
                updateDashboardStats();
                
                const viewAllElement = document.querySelector('.section-title + .view-all');
                if (viewAllElement) {
                    viewAllElement.textContent = `Total: ${teachers.length}`;
                }
                
                showToast(`Teacher ${deletedTeacher.name} deleted successfully`, 'success');
            }
            
            closeDeleteModal();
        } else {
            const error = await response.json();
            showToast(error.error || 'Failed to delete teacher', 'error');
            if (deleteBtn) {
                setButtonLoading(deleteBtn, false);
            }
        }
    } catch (error) {
        console.error('Delete teacher error:', error);
        showToast('Failed to delete teacher. Please try again.', 'error');
        if (deleteBtn) {
            setButtonLoading(deleteBtn, false);
        }
    }
}

function closeDeleteModal() {
    const studentModal = document.getElementById('deleteStudentModal');
    const teacherModal = document.getElementById('deleteTeacherModal');
    
    if (studentModal) {
        studentModal.remove();
    }
    if (teacherModal) {
        teacherModal.remove();
    }
}

document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
        closeDeleteModal();
    }
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeDeleteModal();
    }
});
// Add these variables and functions to your existing script.js file

// Global variables for new features


// Load all new data
async function loadEnhancedData() {
    try {
        // Load allocations
        const allocResponse = await fetch('/api/allocations', { headers: authHeaders() });
        if (allocResponse.ok) allocations = await allocResponse.json();
        
        // Load announcements
        const annResponse = await fetch('/api/announcements?active_only=true', { headers: authHeaders() });
        if (annResponse.ok) announcements = await annResponse.json();
        
        // Load subjects
        const subjResponse = await fetch('/api/subjects', { headers: authHeaders() });
        if (subjResponse.ok) subjects = await subjResponse.json();
        
        // Load classes
        const classResponse = await fetch('/api/classes', { headers: authHeaders() });
        if (classResponse.ok) classes = await classResponse.json();
    } catch (error) {
        console.error('Error loading enhanced data:', error);
    }
}

// Update loadDashboardData to include new features
const originalLoadDashboard = loadDashboardData;
loadDashboardData = async function() {
    await originalLoadDashboard.call(this);
    await loadEnhancedData();
    updateDashboardWithAnnouncements();
};

// =====================================================
// CLASS ALLOCATIONS MANAGEMENT
// =====================================================

function showAllocationsContent() {
    elements.contentArea.innerHTML = `
        <div class="form-container">
            <div class="form-title">Assign Teacher to Class & Subject</div>
            <form id="allocationForm" novalidate>
                <div class="form-row">
                    <div class="form-group">
                        <label for="allocTeacher">Teacher *</label>
                        <select id="allocTeacher" class="form-control" required>
                            <option value="">Select Teacher</option>
                            ${teachers.map(t => `<option value="${t.id}">${t.name} (${t.subject})</option>`).join('')}
                        </select>
                        <span class="error-message" id="allocTeacherError"></span>
                    </div>
                    <div class="form-group">
                        <label for="allocClass">Class *</label>
                        <select id="allocClass" class="form-control" required>
                            <option value="">Select Class</option>
                            ${classes.map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
                        </select>
                        <span class="error-message" id="allocClassError"></span>
                    </div>
                    <div class="form-group">
                        <label for="allocSubject">Subject *</label>
                        <select id="allocSubject" class="form-control" required>
                            <option value="">Select Subject</option>
                            ${subjects.map(s => `<option value="${s.name}">${s.name}</option>`).join('')}
                        </select>
                        <span class="error-message" id="allocSubjectError"></span>
                    </div>
                    <div class="form-group">
                        <label for="allocYear">Academic Year</label>
                        <input type="text" id="allocYear" class="form-control" value="2024/2025">
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="action-btn outline" onclick="document.getElementById('allocationForm').reset()">Reset</button>
                    <button type="submit" class="action-btn">
                        <span class="btn-text">Assign Teacher</span>
                        <span class="btn-spinner" style="display: none;"><i class="fas fa-spinner fa-spin"></i></span>
                    </button>
                </div>
            </form>
        </div>

        <div class="recent-section">
            <div class="section-header">
                <div class="section-title">Current Allocations</div>
                <div class="view-all">Total: ${allocations.length}</div>
            </div>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Teacher</th>
                            <th>Primary Subject</th>
                            <th>Class</th>
                            <th>Subject Teaching</th>
                            <th>Academic Year</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody id="allocationsTableBody"></tbody>
                </table>
            </div>
        </div>
    `;
    
    populateAllocationsTable();
    
    const form = document.getElementById('allocationForm');
    if (form) form.addEventListener('submit', handleCreateAllocation);
}

function populateAllocationsTable() {
    const tbody = document.getElementById('allocationsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (allocations.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No allocations found</td></tr>';
        return;
    }
    
    allocations.forEach(alloc => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${alloc.teacher_name || 'N/A'}</td>
            <td>${alloc.teacher_subject || 'N/A'}</td>
            <td>${alloc.class_name}</td>
            <td>${alloc.subject}</td>
            <td>${alloc.academic_year}</td>
            <td>
                ${currentUser && currentUser.role === 'admin' ? 
                    `<button class="action-btn" style="background: #dc3545;" onclick="deleteAllocation('${alloc.id}')">Remove</button>` 
                    : '<span style="color: var(--gray);">View Only</span>'}
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function handleCreateAllocation(e) {
    e.preventDefault();
    
    const formData = {
        teacher_id: document.getElementById('allocTeacher').value,
        class_name: document.getElementById('allocClass').value,
        subject: document.getElementById('allocSubject').value,
        academic_year: document.getElementById('allocYear').value
    };
    
    if (!formData.teacher_id || !formData.class_name || !formData.subject) {
        showToast('Please fill all required fields', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/allocations', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            const newAlloc = await response.json();
            allocations.unshift(newAlloc);
            document.getElementById('allocationForm').reset();
            populateAllocationsTable();
            showToast('Teacher assigned successfully!', 'success');
        } else {
            const error = await response.json();
            showToast(error.message || 'Failed to create allocation', 'error');
        }
    } catch (error) {
        console.error('Error creating allocation:', error);
        showToast('Network error. Please try again.', 'error');
    }
}

async function deleteAllocation(id) {
    if (!confirm('Remove this allocation?')) return;
    
    try {
        const response = await fetch(`/api/allocations/${id}`, {
            method: 'DELETE',
            headers: authHeaders()
        });
        
        if (response.ok) {
            allocations = allocations.filter(a => a.id !== id);
            populateAllocationsTable();
            showToast('Allocation removed successfully', 'success');
        } else {
            showToast('Failed to remove allocation', 'error');
        }
    } catch (error) {
        console.error('Error deleting allocation:', error);
        showToast('Network error. Please try again.', 'error');
    }
}

// =====================================================
// ATTENDANCE MANAGEMENT
// =====================================================

function showAttendanceContent() {
    const today = new Date().toISOString().split('T')[0];
    const uniqueClasses = [...new Set(students.map(s => s.class).filter(c => c))].sort();
    
    elements.contentArea.innerHTML = `
        <div class="form-container">
            <div class="form-title">Mark Attendance</div>
            <div class="form-row" style="margin-bottom: 20px;">
                <div class="form-group">
                    <label for="attendanceDate">Date</label>
                    <input type="date" id="attendanceDate" class="form-control" value="${today}" max="${today}">
                </div>
                <div class="form-group">
                    <label for="attendanceClass">Class</label>
                    <select id="attendanceClass" class="form-control">
                        <option value="">Select Class</option>
                        ${uniqueClasses.map(c => `<option value="${c}">${c}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group" style="display: flex; align-items: flex-end;">
                    <button class="action-btn" onclick="loadAttendanceForClass()" style="width: 100%;">
                        Load Students
                    </button>
                </div>
            </div>
            
            <div id="attendanceMarkingArea" style="display: none;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h3 style="margin: 0;">Mark Attendance</h3>
                    <div style="display: flex; gap: 10px;">
                        <button class="action-btn outline" onclick="markAllAs('present')">Mark All Present</button>
                        <button class="action-btn outline" onclick="markAllAs('absent')">Mark All Absent</button>
                    </div>
                </div>
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Student ID</th>
                                <th>Name</th>
                                <th>Status</th>
                                <th>Remarks</th>
                            </tr>
                        </thead>
                        <tbody id="attendanceStudentsBody"></tbody>
                    </table>
                </div>
                <div class="form-actions" style="margin-top: 20px;">
                    <button class="action-btn" onclick="submitAttendance()">
                        <span class="btn-text">Save Attendance</span>
                        <span class="btn-spinner" style="display: none;"><i class="fas fa-spinner fa-spin"></i></span>
                    </button>
                </div>
            </div>
        </div>

        <div class="recent-section">
            <div class="section-header">
                <div class="section-title">Attendance Records</div>
                <button class="action-btn" onclick="viewAttendanceSummary()">
                    <i class="fas fa-chart-bar"></i> View Summary
                </button>
            </div>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Student</th>
                            <th>Class</th>
                            <th>Status</th>
                            <th>Marked By</th>
                            <th>Remarks</th>
                        </tr>
                    </thead>
                    <tbody id="attendanceRecordsBody"></tbody>
                </table>
            </div>
        </div>
    `;
    
    loadAttendanceRecords();
}

async function loadAttendanceForClass() {
    const className = document.getElementById('attendanceClass').value;
    const date = document.getElementById('attendanceDate').value;
    
    if (!className) {
        showToast('Please select a class', 'warning');
        return;
    }
    
    const classStudents = students.filter(s => s.class === className && s.status === 'Active');
    
    if (classStudents.length === 0) {
        showToast('No students found in this class', 'warning');
        return;
    }
    
    // Check if attendance already marked for this date
    try {
        const response = await fetch(`/api/attendance?date=${date}&class=${className}`, { 
            headers: authHeaders() 
        });
        const existingAttendance = response.ok ? await response.json() : [];
        
        const attendanceMap = {};
        existingAttendance.forEach(a => {
            attendanceMap[a.student_id] = { status: a.status, remarks: a.remarks || '' };
        });
        
        const tbody = document.getElementById('attendanceStudentsBody');
        tbody.innerHTML = '';
        
        classStudents.forEach(student => {
            const existing = attendanceMap[student.id] || { status: 'present', remarks: '' };
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${student.id}</td>
                <td>${student.name}</td>
                <td>
                    <select class="form-control attendance-status" data-student="${student.id}" style="width: auto;">
                        <option value="present" ${existing.status === 'present' ? 'selected' : ''}>Present</option>
                        <option value="absent" ${existing.status === 'absent' ? 'selected' : ''}>Absent</option>
                        <option value="late" ${existing.status === 'late' ? 'selected' : ''}>Late</option>
                        <option value="excused" ${existing.status === 'excused' ? 'selected' : ''}>Excused</option>
                    </select>
                </td>
                <td>
                    <input type="text" class="form-control attendance-remarks" data-student="${student.id}" 
                           value="${existing.remarks}" placeholder="Optional remarks" style="width: 200px;">
                </td>
            `;
            tbody.appendChild(row);
        });
        
        document.getElementById('attendanceMarkingArea').style.display = 'block';
    } catch (error) {
        console.error('Error loading attendance:', error);
        showToast('Error loading attendance data', 'error');
    }
}

function markAllAs(status) {
    const selects = document.querySelectorAll('.attendance-status');
    selects.forEach(select => select.value = status);
}

async function submitAttendance() {
    const date = document.getElementById('attendanceDate').value;
    const className = document.getElementById('attendanceClass').value;
    
    const records = [];
    const statusSelects = document.querySelectorAll('.attendance-status');
    
    statusSelects.forEach(select => {
        const studentId = select.dataset.student;
        const status = select.value;
        const remarksInput = document.querySelector(`.attendance-remarks[data-student="${studentId}"]`);
        const remarks = remarksInput ? remarksInput.value : '';
        
        records.push({
            student_id: studentId,
            class: className,
            attendance_date: date,
            status: status,
            remarks: remarks
        });
    });
    
    if (records.length === 0) {
        showToast('No attendance to submit', 'warning');
        return;
    }
    
    try {
        const response = await fetch('/api/attendance', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ records })
        });
        
        if (response.ok) {
            showToast(`Attendance saved for ${records.length} student(s)`, 'success');
            document.getElementById('attendanceMarkingArea').style.display = 'none';
            document.getElementById('attendanceClass').value = '';
            loadAttendanceRecords();
        } else {
            const error = await response.json();
            showToast(error.message || 'Failed to save attendance', 'error');
        }
    } catch (error) {
        console.error('Error submitting attendance:', error);
        showToast('Network error. Please try again.', 'error');
    }
}

async function loadAttendanceRecords() {
    try {
        const response = await fetch('/api/attendance', { headers: authHeaders() });
        if (!response.ok) return;
        
        const records = await response.json();
        const tbody = document.getElementById('attendanceRecordsBody');
        
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (records.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No attendance records found</td></tr>';
            return;
        }
        
        records.slice(0, 50).forEach(record => {
            const row = document.createElement('tr');
            const statusClass = record.status === 'present' ? 'paid' : 
                               record.status === 'late' ? 'pending' : 'overdue';
            
            row.innerHTML = `
                <td>${formatDate(record.attendance_date)}</td>
                <td>${record.student_name || 'N/A'}</td>
                <td>${record.student_class || 'N/A'}</td>
                <td><span class="status ${statusClass}">${record.status}</span></td>
                <td>${record.marked_by_name || 'N/A'}</td>
                <td>${record.remarks || '-'}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading attendance records:', error);
    }
}

async function viewAttendanceSummary() {
    try {
        const response = await fetch('/api/attendance/summary', { headers: authHeaders() });
        if (!response.ok) return;
        
        const summary = await response.json();
        
        const modalBody = document.querySelector('#studentModal .modal-body');
        modalBody.innerHTML = `
            <h3 style="margin-bottom: 20px;">Attendance Summary (Last 30 Days)</h3>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Class</th>
                            <th>Total Days</th>
                            <th>Present</th>
                            <th>Absent</th>
                            <th>Late</th>
                            <th>Rate</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${summary.map(s => `
                            <tr>
                                <td>${s.student_name}</td>
                                <td>${s.class}</td>
                                <td>${s.total_days || 0}</td>
                                <td>${s.present_days || 0}</td>
                                <td>${s.absent_days || 0}</td>
                                <td>${s.late_days || 0}</td>
                                <td>
                                    <span class="status ${s.attendance_percentage >= 75 ? 'paid' : s.attendance_percentage >= 50 ? 'pending' : 'overdue'}">
                                        ${s.attendance_percentage || 0}%
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        showModal('studentModal');
    } catch (error) {
        console.error('Error loading attendance summary:', error);
        showToast('Error loading summary', 'error');
    }
}

// =====================================================
// ANNOUNCEMENTS / NOTICEBOARD
// =====================================================

function showAnnouncementsContent() {
    elements.contentArea.innerHTML = `
        <div class="form-container">
            <div class="form-title">Create Announcement</div>
            <form id="announcementForm" novalidate>
                <div class="form-row">
                    <div class="form-group">
                        <label for="annTitle">Title *</label>
                        <input type="text" id="annTitle" class="form-control" placeholder="Announcement title" required>
                    </div>
                    <div class="form-group">
                        <label for="annCategory">Category</label>
                        <select id="annCategory" class="form-control">
                            <option value="general">General</option>
                            <option value="academic">Academic</option>
                            <option value="event">Event</option>
                            <option value="urgent">Urgent</option>
                            <option value="holiday">Holiday</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="annPriority">Priority</label>
                        <select id="annPriority" class="form-control">
                            <option value="low">Low</option>
                            <option value="normal" selected>Normal</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="annAudience">Target Audience</label>
                        <select id="annAudience" class="form-control">
                            <option value="all">Everyone</option>
                            <option value="students">Students</option>
                            <option value="teachers">Teachers</option>
                            <option value="parents">Parents</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="annStartDate">Start Date</label>
                        <input type="date" id="annStartDate" class="form-control" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="form-group">
                        <label for="annEndDate">End Date (Optional)</label>
                        <input type="date" id="annEndDate" class="form-control">
                    </div>
                </div>
                <div class="form-group">
                    <label for="annContent">Content *</label>
                    <textarea id="annContent" class="form-control" rows="4" placeholder="Announcement details..." required></textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="action-btn outline" onclick="document.getElementById('announcementForm').reset()">Reset</button>
                    <button type="submit" class="action-btn">
                        <span class="btn-text">Publish Announcement</span>
                        <span class="btn-spinner" style="display: none;"><i class="fas fa-spinner fa-spin"></i></span>
                    </button>
                </div>
            </form>
        </div>

        <div class="recent-section">
            <div class="section-header">
                <div class="section-title">Noticeboard</div>
                <div class="tabs">
                    <div class="tab active" data-category="">All</div>
                    <div class="tab" data-category="general">General</div>
                    <div class="tab" data-category="academic">Academic</div>
                    <div class="tab" data-category="event">Events</div>
                    <div class="tab" data-category="urgent">Urgent</div>
                </div>
            </div>
            <div id="announcementsList"></div>
        </div>
    `;
    
    populateAnnouncements();
    
    const form = document.getElementById('announcementForm');
    if (form) form.addEventListener('submit', handleCreateAnnouncement);
    
    // Category filter tabs
    document.querySelectorAll('.tab[data-category]').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            populateAnnouncements(this.dataset.category);
        });
    });
}

function populateAnnouncements(category = '') {
    const container = document.getElementById('announcementsList');
    if (!container) return;
    
    let filtered = announcements;
    if (category) {
        filtered = announcements.filter(a => a.category === category);
    }
    
    container.innerHTML = '';
    
    if (filtered.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--gray);">No announcements found</div>';
        return;
    }
    
    filtered.forEach(ann => {
        const priorityColors = {
            low: '#6c757d',
            normal: '#4361ee',
            high: '#ffc107',
            urgent: '#dc3545'
        };
        
        const card = document.createElement('div');
        card.className = 'announcement-card';
        card.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 15px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            border-left: 4px solid ${priorityColors[ann.priority] || '#4361ee'};
        `;
        
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                <h3 style="margin: 0; color: var(--dark);">${ann.title}</h3>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <span class="status" style="background: rgba(67,97,238,0.1); color: var(--primary);">${ann.category}</span>
                    ${currentUser && currentUser.role === 'admin' ? 
                        `<button class="action-btn" style="background: #dc3545; padding: 5px 10px; font-size: 12px;" onclick="deleteAnnouncement('${ann.id}')">Delete</button>` 
                        : ''}
                </div>
            </div>
            <p style="color: var(--gray); margin-bottom: 10px;">${ann.content}</p>
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 14px; color: var(--gray);">
                <div>
                    <i class="fas fa-user"></i> ${ann.published_by_name || 'System'} â€¢ 
                    <i class="fas fa-calendar"></i> ${formatDate(ann.start_date)}
                    ${ann.end_date ? ` - ${formatDate(ann.end_date)}` : ''}
                </div>
                <div>
                    <span style="color: ${priorityColors[ann.priority]}; font-weight: 600;">
                        <i class="fas fa-flag"></i> ${ann.priority.toUpperCase()}
                    </span>
                </div>
            </div>
        `;
        
        container.appendChild(card);
    });
}

async function handleCreateAnnouncement(e) {
    e.preventDefault();
    
    const formData = {
        title: document.getElementById('annTitle').value.trim(),
        content: document.getElementById('annContent').value.trim(),
        category: document.getElementById('annCategory').value,
        priority: document.getElementById('annPriority').value,
        target_audience: document.getElementById('annAudience').value,
        start_date: document.getElementById('annStartDate').value,
        end_date: document.getElementById('annEndDate').value || null
    };
    
    if (!formData.title || !formData.content) {
        showToast('Title and content are required', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/announcements', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            const newAnn = await response.json();
            announcements.unshift(newAnn);
            document.getElementById('announcementForm').reset();
            populateAnnouncements();
            showToast('Announcement published successfully!', 'success');
        } else {
            const error = await response.json();
            showToast(error.message || 'Failed to create announcement', 'error');
        }
    } catch (error) {
        console.error('Error creating announcement:', error);
        showToast('Network error. Please try again.', 'error');
    }
}

async function deleteAnnouncement(id) {
    if (!confirm('Delete this announcement?')) return;
    
    try {
        const response = await fetch(`/api/announcements/${id}`, {
            method: 'DELETE',
            headers: authHeaders()
        });
        
        if (response.ok) {
            announcements = announcements.filter(a => a.id !== id);
            populateAnnouncements();
            showToast('Announcement deleted successfully', 'success');
        } else {
            showToast('Failed to delete announcement', 'error');
        }
    } catch (error) {
        console.error('Error deleting announcement:', error);
        showToast('Network error. Please try again.', 'error');
    }
}

// Show announcements on dashboard
function updateDashboardWithAnnouncements() {
    if (announcements.length === 0) return;
    
    const urgentAnnouncements = announcements.filter(a => 
        a.priority === 'urgent' || a.priority === 'high'
    ).slice(0, 3);
    
    if (urgentAnnouncements.length > 0) {
        const dashboardContent = document.querySelector('.dashboard-overview');
        if (dashboardContent && dashboardContent.parentNode) {
            const announcementSection = document.createElement('div');
            announcementSection.className = 'recent-section';
            announcementSection.style.marginTop = '20px';
            announcementSection.innerHTML = `
                <div class="section-header">
                    <div class="section-title">ðŸ“¢ Important Announcements</div>
                    <div class="view-all" onclick="navigateToPage('announcements')">View All</div>
                </div>
                <div id="dashboardAnnouncements"></div>
            `;
            
            dashboardContent.parentNode.insertBefore(announcementSection, dashboardContent.nextSibling);
            
            const container = document.getElementById('dashboardAnnouncements');
            urgentAnnouncements.forEach(ann => {
                const card = document.createElement('div');
                card.style.cssText = `
                    background: ${ann.priority === 'urgent' ? 'rgba(220,53,69,0.1)' : 'rgba(255,193,7,0.1)'};
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 10px;
                    border-left: 4px solid ${ann.priority === 'urgent' ? '#dc3545' : '#ffc107'};
                `;
                card.innerHTML = `
                    <strong>${ann.title}</strong>
                    <p style="margin: 5px 0 0 0; font-size: 14px; color: var(--gray);">${ann.content.substring(0, 100)}...</p>
                `;
                container.appendChild(card);
            });
        }
    }
}

// Update navigation to include new pages
const originalNavigateToPage = navigateToPage;
navigateToPage = function(page) {
    if (page === 'allocations') {
        showAllocationsContent();
        return;
    }
    if (page === 'attendance') {
        showAttendanceContent();
        return;
    }
    if (page === 'announcements') {
        showAnnouncementsContent();
        return;
    }
    return originalNavigateToPage.call(this, page);
};

// EXCEL EXPORT FUNCTIONALITY
function exportStudentsToExcel() {
    try {
        const wb = XLSX.utils.book_new();
        
        const exportData = students.map(student => ({
            'Student ID': student.id,
            'Full Name': student.name,
            'Class': student.class || 'N/A',
            'Email': student.email || 'N/A',
            'Phone': student.phone || 'N/A',
            'Date of Birth': student.dob ? formatDate(student.dob) : 'N/A',
            'Parent/Guardian': student.parent || 'N/A',
            'Parent Phone': student.parentPhone || 'N/A',
            'Address': student.address || 'N/A',
            'Status': student.status || 'Active'
        }));
        
        const ws = XLSX.utils.json_to_sheet(exportData);
        
        ws['!cols'] = [
            { wch: 12 }, { wch: 25 }, { wch: 12 }, { wch: 25 }, { wch: 15 },
            { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 30 }, { wch: 10 }
        ];
        
        XLSX.utils.book_append_sheet(wb, ws, 'Students');
        
        const date = new Date().toISOString().split('T')[0];
        const filename = `Students_Data_${date}.xlsx`;
        
        XLSX.writeFile(wb, filename);
        
        showToast(`Exported ${students.length} students to ${filename}`, 'success');
    } catch (error) {
        console.error('Export error:', error);
        showToast('Export failed. Using fallback CSV export...', 'warning');
        exportStudentsToCSV();
    }
}

function exportStudentsToCSV() {
    const headers = ['Student ID', 'Full Name', 'Class', 'Email', 'Phone', 'Date of Birth', 'Parent/Guardian', 'Parent Phone', 'Address', 'Status'];
    
    const rows = students.map(student => [
        student.id,
        student.name,
        student.class || 'N/A',
        student.email || 'N/A',
        student.phone || 'N/A',
        student.dob ? formatDate(student.dob) : 'N/A',
        student.parent || 'N/A',
        student.parentPhone || 'N/A',
        student.address || 'N/A',
        student.status || 'Active'
    ]);
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().split('T')[0];
    
    link.setAttribute('href', url);
    link.setAttribute('download', `Students_Data_${date}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast(`Exported ${students.length} students to CSV`, 'success');
}

function exportFeesToExcel() {
    try {
        const wb = XLSX.utils.book_new();
        
        const exportData = fees.map(fee => ({
            'Invoice ID': fee.id,
            'Student Name': fee.student || 'N/A',
            'Student ID': fee.studentId || 'N/A',
            'Class': fee.class || 'N/A',
            'Amount (GHS)': fee.amount,
            'Paid (GHS)': fee.totalPaid || 0,
            'Balance (GHS)': fee.balance || 0,
            'Due Date': fee.dueDate ? formatDate(fee.dueDate) : 'N/A',
            'Status': fee.status.charAt(0).toUpperCase() + fee.status.slice(1),
            'Payment Count': fee.payments ? fee.payments.length : 0
        }));
        
        const ws = XLSX.utils.json_to_sheet(exportData);
        
        ws['!cols'] = [
            { wch: 15 }, { wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 15 },
            { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 15 }
        ];
        
        XLSX.utils.book_append_sheet(wb, ws, 'Fee Records');
        
        const paidFees = fees.filter(f => f.status === 'paid');
        const pendingFees = fees.filter(f => f.status === 'pending' || f.status === 'partial');
        const overdueFees = fees.filter(f => f.status === 'overdue');
        
        const summaryData = [
            { 'Description': 'Total Invoices', 'Value': fees.length },
            { 'Description': 'Paid Invoices', 'Value': paidFees.length },
            { 'Description': 'Pending Invoices', 'Value': pendingFees.length },
            { 'Description': 'Overdue Invoices', 'Value': overdueFees.length },
            { 'Description': '', 'Value': '' },
            { 'Description': 'Total Amount (GHS)', 'Value': fees.reduce((sum, f) => sum + f.amount, 0).toFixed(2) },
            { 'Description': 'Collected (GHS)', 'Value': fees.reduce((sum, f) => sum + (f.totalPaid || 0), 0).toFixed(2) },
            { 'Description': 'Balance (GHS)', 'Value': fees.reduce((sum, f) => sum + (f.balance || 0), 0).toFixed(2) }
        ];
        
        const wsSummary = XLSX.utils.json_to_sheet(summaryData);
        wsSummary['!cols'] = [{ wch: 25 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
        
        const date = new Date().toISOString().split('T')[0];
        const filename = `Fee_Records_${date}.xlsx`;
        
        XLSX.writeFile(wb, filename);
        
        showToast(`Exported ${fees.length} fee records to ${filename}`, 'success');
    } catch (error) {
        console.error('Export error:', error);
        showToast('Export failed. Using fallback CSV export...', 'warning');
        exportFeesToCSV();
    }
}

function exportFeesToCSV() {
    const headers = ['Invoice ID', 'Student Name', 'Student ID', 'Class', 'Amount (GHS)', 'Paid (GHS)', 'Balance (GHS)', 'Due Date', 'Status', 'Payment Count'];
    
    const rows = fees.map(fee => [
        fee.id,
        fee.student || 'N/A',
        fee.studentId || 'N/A',
        fee.class || 'N/A',
        fee.amount,
        fee.totalPaid || 0,
        fee.balance || 0,
        fee.dueDate ? formatDate(fee.dueDate) : 'N/A',
        fee.status.charAt(0).toUpperCase() + fee.status.slice(1),
        fee.payments ? fee.payments.length : 0
    ]);
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().split('T')[0];
    
    link.setAttribute('href', url);
    link.setAttribute('download', `Fee_Records_${date}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast(`Exported ${fees.length} fee records to CSV`, 'success');
}


//Enhanced dashboard with announcements widget
function showEnhancedDashboard() {
    const currentStudentCount = students.length;
    const currentTotalFees = calculateTotalFees();
    const urgentAnnouncements = announcements.filter(a => 
        a.priority === 'urgent' && a.is_active
    ).slice(0, 2);
    
    elements.contentArea.innerHTML = `
        ${urgentAnnouncements.length > 0 ? `
        <div class="info-box" style="background: rgba(220, 53, 69, 0.05); border-left-color: #dc3545; margin-bottom: 20px;">
            <i class="fas fa-exclamation-triangle" style="color: #dc3545;"></i>
            <div>
                <strong>Urgent Announcements</strong>
                ${urgentAnnouncements.map(a => `<div style="margin-top: 5px;">${a.title}</div>`).join('')}
                <a href="#" onclick="navigateToPage('announcements'); return false;" style="color: #dc3545; font-size: 14px; margin-top: 5px; display: inline-block;">View All â†’</a>
            </div>
        </div>
        ` : ''}
        
        <div class="dashboard-overview">
            <div class="stat-card students">
                <div class="stat-icon">
                    <i class="fas fa-user-graduate"></i>
                </div>
                <div class="stat-info">
                    <h3 id="totalStudents">${currentStudentCount}</h3>
                    <p>Total Students</p>
                </div>
            </div>
            <div class="stat-card teachers">
                <div class="stat-icon">
                    <i class="fas fa-chalkboard-teacher"></i>
                </div>
                <div class="stat-info">
                    <h3 id="totalTeachers">${teachers.length}</h3>
                    <p>Teachers</p>
                </div>
            </div>
            <div class="stat-card fees">
                <div class="stat-icon">
                    <i class="fas fa-money-bill-wave"></i>
                </div>
                <div class="stat-info">
                    <h3 id="totalFees">${currentTotalFees}</h3>
                    <p>Total Fees Collected</p>
                </div>
            </div>
            <div class="stat-card attendance">
                <div class="stat-icon">
                    <i class="fas fa-clipboard-check"></i>
                </div>
                <div class="stat-info">
                    <h3 id="avgAttendance">--%</h3>
                    <p>Avg Attendance Rate</p>
                </div>
            </div>
        </div>

        <div class="charts-container">
            <div class="chart-card">
                <div class="chart-header">
                    <div class="chart-title">Student Enrollment</div>
                    <div class="chart-actions">
                        <button title="Refresh"><i class="fas fa-sync"></i></button>
                    </div>
                </div>
                <div class="chart-container">
                    <canvas id="enrollmentChart"></canvas>
                </div>
            </div>
            <div class="chart-card">
                <div class="chart-header">
                    <div class="chart-title">Fee Collection</div>
                    <div class="chart-actions">
                        <button title="Refresh"><i class="fas fa-sync"></i></button>
                    </div>
                </div>
                <div class="chart-container">
                    <canvas id="feeChart"></canvas>
                </div>
            </div>
        </div>

        <div class="recent-section">
            <div class="section-header">
                <div class="section-title">Recent Students</div>
                <div class="view-all" onclick="navigateToPage('students')">View All</div>
            </div>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Student ID</th>
                            <th>Name</th>
                            <th>Class</th>
                            <th>Parent</th>
                            <th>Contact</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody id="studentsTableBody"></tbody>
                </table>
            </div>
        </div>

        <div class="recent-section">
            <div class="section-header">
                <div class="section-title">Fee Records</div>
                <div class="tabs">
                    <div class="tab active" data-tab="all">All Fees</div>
                    <div class="tab" data-tab="paid">Paid</div>
                    <div class="tab" data-tab="pending">Pending</div>
                    <div class="tab" data-tab="overdue">Overdue</div>
                </div>
            </div>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Invoice ID</th>
                            <th>Student</th>
                            <th>Class</th>
                            <th>Amount</th>
                            <th>Paid</th>
                            <th>Balance</th>
                            <th>Due Date</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody id="feeTableBody"></tbody>
                </table>
            </div>
        </div>
    `;
    
    elements.studentsTableBody = document.getElementById('studentsTableBody');
    elements.feeTableBody = document.getElementById('feeTableBody');
    elements.totalStudents = document.getElementById('totalStudents');
    elements.totalFees = document.getElementById('totalFees');
    
    populateStudentsTable();
    populateFeesTable();
    
    setTimeout(() => {
        initCharts();
        initializeTabs();
        loadAverageAttendance();
    }, 100);
}

// Load average attendance rate
async function loadAverageAttendance() {
    try {
        const response = await fetch('/api/attendance/summary', { headers: authHeaders() });
        if (response.ok) {
            const summary = await response.json();
            const avgElement = document.getElementById('avgAttendance');
            if (avgElement && summary.length > 0) {
                const total = summary.reduce((sum, s) => sum + parseFloat(s.attendance_percentage || 0), 0);
                const avg = Math.round(total / summary.length);
                avgElement.textContent = `${avg}%`;
            }
        }
    } catch (error) {
        console.error('Error loading attendance average:', error);
    }
}

// Override original showDashboardContent
showDashboardContent = showEnhancedDashboard;



// Bulk delete students
async function bulkDeleteStudents(studentIds) {
    if (!confirm(`Delete ${studentIds.length} student(s)? This action cannot be undone.`)) {
        return;
    }
    
    try {
        const response = await fetch('/api/students', {
            method: 'DELETE',
            headers: authHeaders(),
            body: JSON.stringify({ ids: studentIds })
        });
        
        if (response.ok) {
            const result = await response.json();
            students = students.filter(s => !studentIds.includes(s.id));
            populateStudentsTable();
            updateDashboardStats();
            showToast(`${result.deletedCount} student(s) deleted successfully`, 'success');
        } else {
            const error = await response.json();
            showToast(error.error || 'Failed to delete students', 'error');
        }
    } catch (error) {
        console.error('Bulk delete error:', error);
        showToast('Failed to delete students. Please try again.', 'error');
    }
}


// Generate attendance report by date range
async function generateAttendanceReport() {
    const startDate = prompt('Enter start date (YYYY-MM-DD):', 
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    );
    const endDate = prompt('Enter end date (YYYY-MM-DD):', 
        new Date().toISOString().split('T')[0]
    );
    
    if (!startDate || !endDate) return;
    
    try {
        const response = await fetch(
            `/api/reports/attendance?start_date=${startDate}&end_date=${endDate}`,
            { headers: authHeaders() }
        );
        
        if (!response.ok) {
            showToast('Failed to generate report', 'error');
            return;
        }
        
        const report = await response.json();
        
        const reportOutput = document.getElementById('reportOutput');
        const reportContent = document.getElementById('reportContent');
        const reportTitle = document.getElementById('reportTitle');
        
        if (!reportOutput || !reportContent || !reportTitle) {
            console.error('Report elements not found');
            return;
        }
        
        reportTitle.textContent = `Attendance Report (${startDate} to ${endDate})`;
        reportContent.innerHTML = `
            <div style="padding: 20px;">
                <h2 style="margin-bottom: 20px;">G & J Schools - Attendance Report</h2>
                <p style="color: var(--gray); margin-bottom: 30px;">Period: ${formatDate(startDate)} to ${formatDate(endDate)}</p>
                <p style="margin-bottom: 20px;"><strong>Total Students:</strong> ${report.length}</p>
                
                <table style="width: 100%;">
                    <thead>
                        <tr>
                            <th>Student ID</th>
                            <th>Name</th>
                            <th>Class</th>
                            <th>Total Days</th>
                            <th>Present</th>
                            <th>Absent</th>
                            <th>Late</th>
                            <th>Rate</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${report.map(r => `
                            <tr>
                                <td>${r.id}</td>
                                <td>${r.name}</td>
                                <td>${r.class}</td>
                                <td>${r.total_days || 0}</td>
                                <td>${r.present_days || 0}</td>
                                <td>${r.absent_days || 0}</td>
                                <td>${r.late_days || 0}</td>
                                <td>
                                    <span class="status ${r.attendance_percentage >= 75 ? 'paid' : r.attendance_percentage >= 50 ? 'pending' : 'overdue'}">
                                        ${r.attendance_percentage || 0}%
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        reportOutput.style.display = 'block';
        reportOutput.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error generating attendance report:', error);
        showToast('Error generating report', 'error');
    }
}

// DATA EXPORTS 

// Export attendance to CSV
function exportAttendanceToCSV() {
    if (attendance.length === 0) {
        showToast('No attendance data to export', 'warning');
        return;
    }
    
    const headers = ['Date', 'Student ID', 'Student Name', 'Class', 'Status', 'Remarks', 'Marked By'];
    const rows = attendance.map(a => [
        a.attendance_date,
        a.student_id,
        a.student_name || 'N/A',
        a.student_class || 'N/A',
        a.status,
        a.remarks || '',
        a.marked_by_name || 'N/A'
    ]);
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().split('T')[0];
    
    link.setAttribute('href', url);
    link.setAttribute('download', `Attendance_Records_${date}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast(`Exported ${attendance.length} attendance records to CSV`, 'success');
}


// KEYBOARD SHORTCUTS FOR NAVIGATION



document.addEventListener('keydown', function(e) {
    // Alt + key combinations
    if (e.altKey) {
        switch(e.key) {
            case 'd': // Dashboard
                navigateToPage('dashboard');
                e.preventDefault();
                break;
            case 's': // Students
                navigateToPage('students');
                e.preventDefault();
                break;
            case 't': // Teachers
                navigateToPage('teachers');
                e.preventDefault();
                break;
            case 'a': // Attendance
                navigateToPage('attendance');
                e.preventDefault();
                break;
            case 'f': // Finance
                navigateToPage('finance');
                e.preventDefault();
                break;
            case 'n': // Announcements
                navigateToPage('announcements');
                e.preventDefault();
                break;
        }
    }
});


// AUTO-REFRESH FOR ANNOUNCEMENTS

// Auto-refresh announcements every 5 minutes
let announcementRefreshInterval;

function startAnnouncementAutoRefresh() {
    // Clear existing interval
    if (announcementRefreshInterval) {
        clearInterval(announcementRefreshInterval);
    }
    
    // Refresh every 5 minutes
    announcementRefreshInterval = setInterval(async () => {
        try {
            const response = await fetch('/api/announcements?active_only=true', { 
                headers: authHeaders() 
            });
            if (response.ok) {
                announcements = await response.json();
                updateDashboardWithAnnouncements();
            }
        } catch (error) {
            console.error('Error auto-refreshing announcements:', error);
        }
    }, 5 * 60 * 1000); // 5 minutes
}

// Start auto-refresh on page load
if (currentUser) {
    startAnnouncementAutoRefresh();
}


// PERFORMANCE MONITORING


// Track page load times
const performanceMetrics = {
    loadStart: performance.now(),
    loaded: false
};

window.addEventListener('load', function() {
    performanceMetrics.loadEnd = performance.now();
    performanceMetrics.loadTime = performanceMetrics.loadEnd - performanceMetrics.loadStart;
    performanceMetrics.loaded = true;
    
    console.log(`Page loaded in ${performanceMetrics.loadTime.toFixed(2)}ms`);
});


// OFFLINE DETECTION


window.addEventListener('online', function() {
    showToast('Connection restored', 'success');
    if (currentUser) {
        loadDashboardData(); // Refresh data
    }
});

window.addEventListener('offline', function() {
    showToast('No internet connection. Some features may not work.', 'warning');
});


// SESSION TIMEOUT WARNING


let sessionTimeoutWarning;

function startSessionMonitoring() {
    // Clear existing timeout
    if (sessionTimeoutWarning) {
        clearTimeout(sessionTimeoutWarning);
    }
    
    // Warn 5 minutes before 8-hour expiry
    const warningTime = (8 * 60 - 5) * 60 * 1000; // 7 hours 55 minutes
    
    sessionTimeoutWarning = setTimeout(() => {
        showToast('Your session will expire in 5 minutes. Please save your work.', 'warning');
    }, warningTime);
}

// Start monitoring on login
if (currentUser) {
    startSessionMonitoring();
}

// Reset timeout on user activity
let activityTimeout;
document.addEventListener('click', function() {
    clearTimeout(activityTimeout);
    activityTimeout = setTimeout(() => {
        // User has been inactive for 30 minutes
        console.log('User inactive for 30 minutes');
    }, 30 * 60 * 1000);
});


// INITIALIZATION


console.log(`
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘   G & J Schools Management System                  â•‘
â•‘   Enhanced Edition v2.0                            â•‘
â•‘                                                    â•‘
â•‘   Features:                                        â•‘
â•‘   âœ“ Student & Teacher Management                  â•‘
â•‘   âœ“ Class & Subject Allocations                   â•‘
â•‘   âœ“ Attendance Tracking                           â•‘
â•‘   âœ“ Grade Management                              â•‘
â•‘   âœ“ Fee Management with Partial Payments         â•‘
â•‘   âœ“ Announcements & Noticeboard                   â•‘
â•‘   âœ“ Comprehensive Reporting                       â•‘
â•‘                                                    â•‘
â•‘   Ready for use!                                   â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
`);
// Load XLSX library dynamically if not already loaded
if (typeof XLSX === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    script.async = false;
    document.head.appendChild(script);
}

// Error handling for global errors
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    showToast('An unexpected error occurred. Please refresh the page.', 'error');
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
    showToast('Network error. Please check your connection.', 'error');
});