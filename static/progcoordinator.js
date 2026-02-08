// Navigation and State Management
let currentSection = 'dashboard';
let currentPublication = null;

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    loadDashboardData();
    initializeCharts();
    showSection('dashboard');
});

// Navigation functions
function initializeNavigation() {
    // Set up nav link clicks
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('href').substring(1);
            showSection(sectionId);
            
            // Update active state
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add('active');
        currentSection = sectionId;
        
        // Load section-specific data
        switch(sectionId) {
            case 'review':
                loadPublications();
                break;
            case 'analytics':
                updateCharts();
                break;
            case 'guidelines':
                loadGuidelines();
                break;
        }
    }
}

function navigateTo(sectionId) {
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
    if (navLink) {
        navLink.classList.add('active');
    }
    showSection(sectionId);
}

// Dashboard Functions
async function loadDashboardData() {
    try {
        // Fetch current user
        const userResponse = await fetch('/api/current-user');
        const userData = await userResponse.json();
        document.getElementById('coordinatorName').textContent = userData.user.name;
        document.getElementById('username').textContent = userData.user.name;
        
        // Fetch dashboard stats
        const statsResponse = await fetch('/api/dashboard/stats');
        const statsData = await statsResponse.json();
        
        // Update stats
        document.getElementById('pendingCount').textContent = statsData.pending || 0;
        document.getElementById('approvedCount').textContent = statsData.approved || 0;
        document.getElementById('rejectedCount').textContent = statsData.rejected || 0;
        document.getElementById('changesCount').textContent = statsData.changes || 0;
        
        // Fetch recent submissions
        const submissionsResponse = await fetch('/api/publications/recent');
        const submissionsData = await submissionsResponse.json();
        loadRecentSubmissions(submissionsData.publications);
        
        // Fetch notifications
        const notificationsResponse = await fetch('/api/notifications');
        const notificationsData = await notificationsResponse.json();
        loadNotifications(notificationsData.notifications);
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showToast('Error loading dashboard data');
    }
}

function loadRecentSubmissions(publications) {
    const submissionsTable = document.getElementById('recentSubmissions');
    if (!publications || publications.length === 0) {
        submissionsTable.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 20px;">
                    <i class="fas fa-inbox"></i>
                    <p>No submissions found</p>
                </td>
            </tr>
        `;
        return;
    }
    
    submissionsTable.innerHTML = publications.map(pub => `
        <tr>
            <td>${pub.title}</td>
            <td>${pub.researcher_name || 'Unknown'}</td>
            <td>${pub.publication_type || 'Journal Article'}</td>
            <td>${formatDate(pub.submission_date)}</td>
            <td><span class="status ${pub.status}">${getStatusText(pub.status)}</span></td>
            <td>
                <button class="action-btn-small btn-review" onclick="reviewPublication(${pub.id})">
                    <i class="fas fa-eye"></i> Review
                </button>
            </td>
        </tr>
    `).join('');
}

function loadNotifications(notifications) {
    const notificationsList = document.getElementById('notificationsList');
    if (!notifications || notifications.length === 0) {
        notificationsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-bell-slash"></i>
                <p>No notifications</p>
            </div>
        `;
        return;
    }
    
    notificationsList.innerHTML = notifications.map(notif => `
        <div class="activity-item ${notif.is_read ? '' : 'unread'}">
            <div class="activity-icon">
                <i class="fas fa-bell"></i>
            </div>
            <div class="activity-content">
                <p>${notif.message}</p>
                <small>${formatDate(notif.created_at)}</small>
            </div>
        </div>
    `).join('');
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

function getStatusText(status) {
    const statusMap = {
        'pending': 'Pending Review',
        'approved': 'Approved',
        'rejected': 'Rejected',
        'changes': 'Changes Required'
    };
    return statusMap[status] || status;
}

function markAllAsRead() {
    document.querySelectorAll('.activity-item.unread').forEach(item => {
        item.classList.remove('unread');
    });
    showToast('All notifications marked as read');
}

// Publications Review Functions
async function loadPublications() {
    try {
        const response = await fetch('/api/publications/pending');
        const data = await response.json();
        
        const publicationsList = document.getElementById('publicationsList');
        if (!data.publications || data.publications.length === 0) {
            publicationsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>No publications to review</p>
                </div>
            `;
            return;
        }
        
        publicationsList.innerHTML = data.publications.map(pub => `
            <div class="publication-card" data-status="${pub.status}" data-type="${pub.publication_type}" data-department="${pub.department ? pub.department.toLowerCase() : ''}">
                <div class="publication-header">
                    <h3 class="publication-title">${pub.title}</h3>
                    <span class="status ${pub.status}">${getStatusText(pub.status)}</span>
                </div>
                <div class="publication-meta">
                    <span><i class="fas fa-user"></i> ${pub.researcher_name || 'Unknown'}</span>
                    ${pub.department ? `<span><i class="fas fa-building"></i> ${pub.department}</span>` : ''}
                    <span><i class="fas fa-file-alt"></i> ${pub.publication_type || 'Journal Article'}</span>
                    <span><i class="fas fa-calendar"></i> ${formatDate(pub.submission_date)}</span>
                </div>
                ${pub.abstract ? `<p class="publication-abstract">${pub.abstract}</p>` : ''}
                <div class="publication-actions">
                    <button class="action-btn-small btn-review" onclick="reviewPublication(${pub.id})">
                        <i class="fas fa-eye"></i> Review
                    </button>
                    ${pub.file_path ? `<button class="action-btn-small btn-view" onclick="viewPublication(${pub.id})">
                        <i class="fas fa-file-pdf"></i> View PDF
                    </button>` : ''}
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading publications:', error);
        showToast('Error loading publications');
    }
}

function filterPublications() {
    const searchTerm = document.getElementById('searchPublications').value.toLowerCase();
    const statusFilter = document.getElementById('filterStatus').value;
    const typeFilter = document.getElementById('filterType').value;
    const deptFilter = document.getElementById('filterDepartment').value;
    
    document.querySelectorAll('.publication-card').forEach(card => {
        const title = card.querySelector('.publication-title').textContent.toLowerCase();
        const status = card.getAttribute('data-status');
        const type = card.getAttribute('data-type');
        const department = card.getAttribute('data-department');
        
        const matchesSearch = title.includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || status === statusFilter;
        const matchesType = typeFilter === 'all' || type === typeFilter;
        const matchesDept = deptFilter === 'all' || department === deptFilter.toLowerCase();
        
        if (matchesSearch && matchesStatus && matchesType && matchesDept) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

async function reviewPublication(publicationId) {
    try {
        const response = await fetch(`/api/publications/${publicationId}`);
        const data = await response.json();
        
        currentPublication = data.publication;
        
        // Populate modal with real data
        document.getElementById('reviewPublicationDetails').innerHTML = `
            <h3>${currentPublication.title}</h3>
            <div class="publication-meta">
                <div class="meta-item">
                    <span class="meta-label">Researcher:</span>
                    <span class="meta-value">${currentPublication.researcher_name || 'Unknown'}</span>
                </div>
                ${currentPublication.email ? `<div class="meta-item">
                    <span class="meta-label">Email:</span>
                    <span class="meta-value">${currentPublication.email}</span>
                </div>` : ''}
                ${currentPublication.department ? `<div class="meta-item">
                    <span class="meta-label">Department:</span>
                    <span class="meta-value">${currentPublication.department}</span>
                </div>` : ''}
                <div class="meta-item">
                    <span class="meta-label">Type:</span>
                    <span class="meta-value">${currentPublication.publication_type || 'Journal Article'}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Submitted:</span>
                    <span class="meta-value">${formatDate(currentPublication.submission_date)}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Status:</span>
                    <span class="meta-value status ${currentPublication.status}">${getStatusText(currentPublication.status)}</span>
                </div>
            </div>
            ${currentPublication.abstract ? `<div class="publication-abstract">
                <h4>Abstract:</h4>
                <p>${currentPublication.abstract}</p>
            </div>` : ''}
            ${currentPublication.keywords ? `<div class="publication-keywords">
                <h4>Keywords:</h4>
                <p>${currentPublication.keywords}</p>
            </div>` : ''}
            <div class="publication-actions">
                ${currentPublication.file_path ? `<button class="btn-secondary" onclick="viewPublication(${publicationId})">
                    <i class="fas fa-file-pdf"></i> View Full Paper
                </button>` : ''}
                <button class="btn-secondary" onclick="viewProofs(${publicationId})">
                    <i class="fas fa-check-circle"></i> View Proofs
                </button>
            </div>
        `;
        
        // Clear feedback
        document.getElementById('feedback').value = '';
        
        // Show modal
        document.getElementById('reviewModal').classList.add('active');
        
    } catch (error) {
        console.error('Error loading publication:', error);
        showToast('Error loading publication details');
    }
}

function viewPublication(id) {
    alert(`Viewing publication #${id}\nIn a real implementation, this would open the PDF.`);
    closeModal();
}

function viewProofs(id) {
    alert(`Viewing proofs for publication #${id}`);
}

function messageResearcher(id) {
    const email = prompt("Enter message for the researcher:");
    if (email) {
        showToast(`Message sent to researcher for publication #${id}`);
    }
}

function makeDecision(decision) {
    const buttons = document.querySelectorAll('.decision-btn');
    buttons.forEach(btn => btn.classList.remove('selected'));
    
    const selectedBtn = document.querySelector(`.decision-btn.${decision}`);
    if (selectedBtn) {
        selectedBtn.classList.add('selected');
    }
}

async function submitDecision() {
    const feedback = document.getElementById('feedback').value;
    const decision = document.querySelector('.decision-btn.selected');
    
    if (!decision) {
        showToast('Please select a decision first');
        return;
    }
    
    const decisionType = decision.classList[1]; // approve, reject, or changes_required
    
    try {
        const response = await fetch(`/api/publications/${currentPublication.id}/review`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                decision: decisionType,
                feedback: feedback
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast(`Publication ${decisionType}d successfully`);
            closeModal();
            
            // Refresh data
            if (currentSection === 'review') {
                await loadPublications();
            }
            if (currentSection === 'dashboard') {
                await loadDashboardData();
            }
        } else {
            showToast(`Error: ${result.error}`);
        }
        
    } catch (error) {
        console.error('Error submitting decision:', error);
        showToast('Error submitting decision');
    }
}

// Analytics Functions
function initializeCharts() {
    // Type Chart
    const typeCtx = document.getElementById('typeChart').getContext('2d');
    window.typeChart = new Chart(typeCtx, {
        type: 'doughnut',
        data: {
            labels: ['Journal Articles', 'Conference Papers', 'Book Chapters', 'Theses'],
            datasets: [{
                data: [45, 30, 15, 10],
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
    
    // Trend Chart
    const trendCtx = document.getElementById('trendChart').getContext('2d');
    window.trendChart = new Chart(trendCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Submissions',
                data: [12, 19, 15, 25, 22, 30, 28, 32, 35, 40, 38, 45],
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    
    // Department Chart
    const deptCtx = document.getElementById('departmentChart').getContext('2d');
    window.departmentChart = new Chart(deptCtx, {
        type: 'bar',
        data: {
            labels: ['Computer Science', 'Engineering', 'Science', 'Business', 'Arts'],
            datasets: [{
                label: 'Approval Rate (%)',
                data: [85, 78, 72, 90, 65],
                backgroundColor: [
                    'rgba(52, 152, 219, 0.8)',
                    'rgba(46, 204, 113, 0.8)',
                    'rgba(155, 89, 182, 0.8)',
                    'rgba(241, 196, 15, 0.8)',
                    'rgba(230, 126, 34, 0.8)'
                ]
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
    
    // Status Chart
    const statusCtx = document.getElementById('statusChart').getContext('2d');
    window.statusChart = new Chart(statusCtx, {
        type: 'polarArea',
        data: {
            labels: ['Approved', 'Pending', 'Rejected', 'Changes Required'],
            datasets: [{
                data: [48, 12, 5, 8],
                backgroundColor: [
                    'rgba(46, 204, 113, 0.8)',
                    'rgba(52, 152, 219, 0.8)',
                    'rgba(231, 76, 60, 0.8)',
                    'rgba(241, 196, 15, 0.8)'
                ]
            }]
        },
        options: {
            responsive: true
        }
    });
}

function updateCharts() {
    // Mock data update based on filters
    const year = document.getElementById('analyticsYear').value;
    const department = document.getElementById('analyticsDepartment').value;
    const pubType = document.getElementById('analyticsType').value;
    
    // Update summary stats
    document.getElementById('totalPublications').textContent = '125';
    document.getElementById('approvalRate').textContent = '78%';
    document.getElementById('activeResearchers').textContent = '42';
    document.getElementById('avgReviewTime').textContent = '3.2 days';
    
    // Update analytics table
    const mockTableData = [
        { department: 'Computer Science', submitted: 45, approved: 38, rejected: 3, pending: 4 },
        { department: 'Engineering', submitted: 35, approved: 27, rejected: 2, pending: 6 },
        { department: 'Science', submitted: 25, approved: 18, rejected: 4, pending: 3 },
        { department: 'Business', submitted: 20, approved: 18, rejected: 1, pending: 1 }
    ];
    
    const tableBody = document.getElementById('analyticsTable');
    tableBody.innerHTML = mockTableData.map(row => `
        <tr>
            <td>${row.department}</td>
            <td>${row.submitted}</td>
            <td>${row.approved}</td>
            <td>${row.rejected}</td>
            <td>${row.pending}</td>
            <td>${Math.round((row.approved / row.submitted) * 100)}%</td>
        </tr>
    `).join('');
    
    showToast('Charts updated with latest data');
}

function exportReport() {
    // Mock export function
    alert('Report exported successfully! This would download a PDF/Excel file in a real implementation.');
}

// Guidelines Functions
function loadGuidelines() {
    const mockGuidelines = [
        {
            id: 1,
            title: "Publication Submission Guidelines",
            content: "All submissions must include an abstract, keywords, and proof of submission. The manuscript should follow APA 7th edition formatting.",
            category: "submission",
            author: "System Admin",
            date: "2024-01-15"
        },
        {
            id: 2,
            title: "Ethical Review Requirements",
            content: "Research involving human subjects must include ethics approval documentation. Animal studies require IACUC approval.",
            category: "ethics",
            author: "Dr. James Wilson",
            date: "2024-02-10"
        },
        {
            id: 3,
            title: "Formatting Standards",
            content: "Use 12pt Times New Roman, double spacing, and 1-inch margins. Include line numbers for review purposes.",
            category: "formatting",
            author: "Publication Committee",
            date: "2024-03-01"
        },
        {
            id: 4,
            title: "ORCID Integration",
            content: "Researchers must link their ORCID profile to their account for publication tracking and verification.",
            category: "general",
            author: "System Admin",
            date: "2024-03-05"
        }
    ];
    
    const guidelinesList = document.getElementById('guidelinesList');
    guidelinesList.innerHTML = mockGuidelines.map(guide => `
        <div class="guideline-item">
            <h3>
                ${guide.title}
                <span class="guideline-category">${guide.category}</span>
            </h3>
            <p>${guide.content}</p>
            <div class="guideline-meta">
                <span>By ${guide.author} • ${guide.date}</span>
                <div class="guideline-actions">
                    <button class="action-btn-small" onclick="editGuideline(${guide.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="action-btn-small btn-secondary" onclick="deleteGuideline(${guide.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function showAddGuidelineModal() {
    document.getElementById('addGuidelineModal').classList.add('active');
}

function addGuideline(event) {
    event.preventDefault();
    
    const title = document.getElementById('guidelineTitle').value;
    const content = document.getElementById('guidelineContent').value;
    const category = document.getElementById('guidelineCategory').value;
    
    // Mock save
    setTimeout(() => {
        showToast(`Guideline "${title}" added successfully`);
        closeModal();
        loadGuidelines();
        
        // Clear form
        document.getElementById('guidelineForm').reset();
    }, 1000);
}

function editGuideline(id) {
    alert(`Editing guideline #${id}\nIn a real implementation, this would open an editor.`);
}

function deleteGuideline(id) {
    if (confirm('Are you sure you want to delete this guideline?')) {
        showToast(`Guideline #${id} deleted`);
        // In real implementation, remove from list
    }
}

// Missing Data Functions
function checkMissingData() {
    alert('Checking for missing data...\nFound 3 submissions with incomplete information.\nSending reminders to researchers.');
}

// Utility Functions
function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
    currentPublication = null;
}

function showToast(message) {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px 25px;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 3000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
    
    // Add animation styles if not present
    if (!document.querySelector('#toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // In real implementation, call logout API
        window.location.href = '/login';
    }
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modals = document.querySelectorAll('.modal.active');
    modals.forEach(modal => {
        if (event.target === modal) {
            closeModal();
        }
    });
});

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeModal();
    }
});