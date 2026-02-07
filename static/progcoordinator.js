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
function loadDashboardData() {
    // Mock data - Replace with actual API calls
    const mockData = {
        pendingCount: 12,
        approvedCount: 48,
        rejectedCount: 5,
        changesCount: 8,
        recentSubmissions: [
            {
                id: 1,
                title: "Machine Learning in Healthcare",
                researcher: "Dr. Sarah Johnson",
                type: "Journal Article",
                submitted: "2024-03-15",
                status: "pending"
            },
            {
                id: 2,
                title: "Blockchain Applications in Finance",
                researcher: "Prof. Michael Chen",
                type: "Conference Paper",
                submitted: "2024-03-14",
                status: "pending"
            },
            {
                id: 3,
                title: "Sustainable Energy Solutions",
                researcher: "Dr. Emma Wilson",
                type: "Journal Article",
                submitted: "2024-03-13",
                status: "changes"
            },
            {
                id: 4,
                title: "AI Ethics Framework",
                researcher: "Dr. Robert Kim",
                type: "Book Chapter",
                submitted: "2024-03-12",
                status: "pending"
            },
            {
                id: 5,
                title: "Quantum Computing Advances",
                researcher: "Prof. Lisa Wang",
                type: "Journal Article",
                submitted: "2024-03-11",
                status: "pending"
            }
        ],
        notifications: [
            {
                id: 1,
                message: "New submission from Dr. Sarah Johnson",
                time: "2 hours ago",
                read: false
            },
            {
                id: 2,
                message: "Publication #245 has been resubmitted",
                time: "1 day ago",
                read: false
            },
            {
                id: 3,
                message: "Monthly analytics report is ready",
                time: "2 days ago",
                read: true
            },
            {
                id: 4,
                message: "System maintenance scheduled for Friday",
                time: "3 days ago",
                read: true
            }
        ]
    };
    
    // Update stats
    document.getElementById('pendingCount').textContent = mockData.pendingCount;
    document.getElementById('approvedCount').textContent = mockData.approvedCount;
    document.getElementById('rejectedCount').textContent = mockData.rejectedCount;
    document.getElementById('changesCount').textContent = mockData.changesCount;
    
    // Load recent submissions
    const submissionsTable = document.getElementById('recentSubmissions');
    submissionsTable.innerHTML = mockData.recentSubmissions.map(sub => `
        <tr>
            <td>${sub.title}</td>
            <td>${sub.researcher}</td>
            <td>${sub.type}</td>
            <td>${sub.submitted}</td>
            <td><span class="status ${sub.status}">${getStatusText(sub.status)}</span></td>
            <td>
                <button class="action-btn-small btn-review" onclick="reviewPublication(${sub.id})">
                    <i class="fas fa-eye"></i> Review
                </button>
            </td>
        </tr>
    `).join('');
    
    // Load notifications
    const notificationsList = document.getElementById('notificationsList');
    notificationsList.innerHTML = mockData.notifications.map(notif => `
        <div class="activity-item ${notif.read ? '' : 'unread'}">
            <div class="activity-icon">
                <i class="fas fa-bell"></i>
            </div>
            <div class="activity-content">
                <p>${notif.message}</p>
                <small>${notif.time}</small>
            </div>
        </div>
    `).join('');
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
function loadPublications() {
    // Mock data - Replace with actual API calls
    const mockPublications = [
        {
            id: 1,
            title: "Machine Learning in Healthcare: A Comprehensive Review",
            researcher: "Dr. Sarah Johnson",
            department: "Computer Science",
            type: "Journal Article",
            submitted: "2024-03-15",
            status: "pending",
            abstract: "This paper reviews the latest machine learning applications in healthcare..."
        },
        {
            id: 2,
            title: "Blockchain Technology for Secure Financial Transactions",
            researcher: "Prof. Michael Chen",
            department: "Business",
            type: "Conference Paper",
            submitted: "2024-03-14",
            status: "pending",
            abstract: "Exploring blockchain applications in modern financial systems..."
        },
        {
            id: 3,
            title: "Renewable Energy Systems: Future Perspectives",
            researcher: "Dr. Emma Wilson",
            department: "Engineering",
            type: "Journal Article",
            submitted: "2024-03-13",
            status: "changes",
            abstract: "Analysis of sustainable energy solutions for urban environments..."
        },
        {
            id: 4,
            title: "Ethical Considerations in Artificial Intelligence",
            researcher: "Dr. Robert Kim",
            department: "Computer Science",
            type: "Book Chapter",
            submitted: "2024-03-12",
            status: "pending",
            abstract: "Framework for ethical AI development and deployment..."
        },
        {
            id: 5,
            title: "Quantum Computing: Breaking Cryptographic Barriers",
            researcher: "Prof. Lisa Wang",
            department: "Physics",
            type: "Journal Article",
            submitted: "2024-03-11",
            status: "resubmitted",
            abstract: "Quantum computing implications for modern cryptography..."
        },
        {
            id: 6,
            title: "Climate Change Impact on Marine Ecosystems",
            researcher: "Dr. James Miller",
            department: "Environmental Science",
            type: "Journal Article",
            submitted: "2024-03-10",
            status: "pending",
            abstract: "Studying the effects of climate change on ocean biodiversity..."
        }
    ];
    
    const publicationsList = document.getElementById('publicationsList');
    publicationsList.innerHTML = mockPublications.map(pub => `
        <div class="publication-card" data-status="${pub.status}" data-type="${pub.type}" data-department="${pub.department.toLowerCase()}">
            <div class="publication-header">
                <h3 class="publication-title">${pub.title}</h3>
                <span class="status ${pub.status}">${getStatusText(pub.status)}</span>
            </div>
            <div class="publication-meta">
                <span><i class="fas fa-user"></i> ${pub.researcher}</span>
                <span><i class="fas fa-building"></i> ${pub.department}</span>
                <span><i class="fas fa-file-alt"></i> ${pub.type}</span>
                <span><i class="fas fa-calendar"></i> ${pub.submitted}</span>
            </div>
            <p class="publication-abstract">${pub.abstract}</p>
            <div class="publication-actions">
                <button class="action-btn-small btn-review" onclick="reviewPublication(${pub.id})">
                    <i class="fas fa-eye"></i> Review
                </button>
                <button class="action-btn-small btn-view" onclick="viewPublication(${pub.id})">
                    <i class="fas fa-file-pdf"></i> View PDF
                </button>
                <button class="action-btn-small" onclick="messageResearcher(${pub.id})">
                    <i class="fas fa-envelope"></i> Message
                </button>
            </div>
        </div>
    `).join('');
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

function reviewPublication(publicationId) {
    // Mock publication data
    const publication = {
        id: publicationId,
        title: "Machine Learning in Healthcare: A Comprehensive Review",
        researcher: "Dr. Sarah Johnson",
        email: "sarah.johnson@university.edu",
        department: "Computer Science",
        type: "Journal Article",
        submitted: "March 15, 2024",
        abstract: "This paper provides a comprehensive review of machine learning applications in healthcare, focusing on diagnosis, treatment planning, and patient monitoring systems. We analyze recent advancements and discuss future directions for research in this field.",
        keywords: "Machine Learning, Healthcare, AI, Medical Diagnosis, Treatment Planning",
        status: "Pending Review"
    };
    
    currentPublication = publication;
    
    // Populate modal
    document.getElementById('reviewPublicationDetails').innerHTML = `
        <h3>${publication.title}</h3>
        <div class="publication-meta">
            <div class="meta-item">
                <span class="meta-label">Researcher:</span>
                <span class="meta-value">${publication.researcher}</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">Email:</span>
                <span class="meta-value">${publication.email}</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">Department:</span>
                <span class="meta-value">${publication.department}</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">Type:</span>
                <span class="meta-value">${publication.type}</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">Submitted:</span>
                <span class="meta-value">${publication.submitted}</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">Status:</span>
                <span class="meta-value status pending">${publication.status}</span>
            </div>
        </div>
        <div class="publication-abstract">
            <h4>Abstract:</h4>
            <p>${publication.abstract}</p>
        </div>
        <div class="publication-keywords">
            <h4>Keywords:</h4>
            <p>${publication.keywords}</p>
        </div>
        <div class="publication-actions">
            <button class="btn-secondary" onclick="viewPublication(${publicationId})">
                <i class="fas fa-file-pdf"></i> View Full Paper
            </button>
            <button class="btn-secondary" onclick="viewProofs(${publicationId})">
                <i class="fas fa-check-circle"></i> View Proofs
            </button>
        </div>
    `;
    
    // Clear feedback
    document.getElementById('feedback').value = '';
    
    // Show modal
    document.getElementById('reviewModal').classList.add('active');
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

function submitDecision() {
    const feedback = document.getElementById('feedback').value;
    const decision = document.querySelector('.decision-btn.selected');
    
    if (!decision) {
        alert('Please select a decision first');
        return;
    }
    
    const decisionType = decision.classList[1]; // approve, reject, or request-changes
    
    // Mock API call
    setTimeout(() => {
        showToast(`Publication ${decisionType}d successfully`);
        closeModal();
        
        // Refresh the publications list
        if (currentSection === 'review') {
            loadPublications();
        }
        
        // Update dashboard stats
        loadDashboardData();
    }, 1000);
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

//Fetching user info to be displayed
 fetch('http://localhost:3000/user-info', {
    method: 'GET',
    headers: {
'Content-Type': 'application/json'
},
})
.then(response => response.json())
.then(data => {
console.log('Response from server', data)
document.getElementById('coordinatorName').innerText = `${data.user_info.name}`;
document.getElementById('username').innerText = `${data.user_info.username}`;
});

function profile() {
        // In real implementation, call logout API
        window.location.href = '/profile';
}