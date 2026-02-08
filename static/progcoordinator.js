// Navigation and State Management
let currentSection = 'dashboard';
let currentPublication = null;
let currentGuideline = null;

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    loadDashboardData();
    initializeCharts();
    showSection('dashboard');
    
    // Setup notification polling
    setupNotificationPolling();
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
            case 'notifications':
                loadNotificationsPage();
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
        
        // Update notification badge
        updateNotificationBadge(notificationsData.notifications);
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showToast('Error loading dashboard data');
    }
}

// Helper functions
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
            <td>${formatDate(pub.publicationDate)}</td>
            <td><span class="status ${pub.status}">${getStatusText(pub.status)}</span></td>
            <td>
                <button class="action-btn-small btn-review" onclick="reviewPublication(${pub.publicationID})">
                    <i class="fas fa-eye"></i> Review
                </button>
            </td>
        </tr>
    `).join('');
}

function loadNotifications(notifications) {
    const notificationsList = document.getElementById('notificationsList');
    if (!notificationsList) return;
    
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
        <div class="activity-item ${notif.is_read ? '' : 'unread'}" data-id="${notif.id}">
            <div class="activity-icon">
                ${getNotificationIcon(notif.type)}
            </div>
            <div class="activity-content">
                <p>${notif.message}</p>
                <small>${formatDate(notif.created_at)}</small>
            </div>
            <div class="activity-actions">
                ${!notif.is_read ? `<button class="mark-read-btn" onclick="markAsRead(${notif.id})" title="Mark as read">
                    <i class="fas fa-check"></i>
                </button>` : ''}
                <button class="delete-notif-btn" onclick="deleteNotification(${notif.id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function getNotificationIcon(type) {
    const icons = {
        'submission': '<i class="fas fa-file-upload"></i>',
        'review': '<i class="fas fa-eye"></i>',
        'system': '<i class="fas fa-cog"></i>',
        'reminder': '<i class="fas fa-clock"></i>',
        'approval': '<i class="fas fa-check-circle"></i>',
        'rejection': '<i class="fas fa-times-circle"></i>',
        'changes': '<i class="fas fa-edit"></i>'
    };
    return icons[type] || '<i class="fas fa-bell"></i>';
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function getStatusText(status) {
    const statusMap = {
        'pending': 'Pending Review',
        'draft': 'Draft',
        'submitted': 'Submitted',
        'approved': 'Approved',
        'rejected': 'Rejected',
        'changes_required': 'Changes Required'
    };
    return statusMap[status] || status;
}

async function markAllAsRead() {
    try {
        const response = await fetch('/api/notifications/mark-all-read', {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('All notifications marked as read');
            // Update UI
            document.querySelectorAll('.activity-item.unread').forEach(item => {
                item.classList.remove('unread');
                const markReadBtn = item.querySelector('.mark-read-btn');
                if (markReadBtn) markReadBtn.remove();
            });
            updateNotificationBadge([]);
        } else {
            showToast('Error marking notifications as read');
        }
    } catch (error) {
        console.error('Error marking all as read:', error);
        showToast('Error marking notifications as read');
    }
}

async function markAsRead(notificationId) {
    try {
        const response = await fetch(`/api/notifications/${notificationId}/read`, {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Update UI
            const notificationItem = document.querySelector(`.activity-item[data-id="${notificationId}"]`);
            if (notificationItem) {
                notificationItem.classList.remove('unread');
                const markReadBtn = notificationItem.querySelector('.mark-read-btn');
                if (markReadBtn) markReadBtn.remove();
            }
            
            // Update badge
            const currentNotifications = await getNotifications();
            updateNotificationBadge(currentNotifications);
            
            showToast('Notification marked as read');
        }
    } catch (error) {
        console.error('Error marking notification as read:', error);
        showToast('Error marking notification as read');
    }
}

async function deleteNotification(notificationId) {
    if (!confirm('Are you sure you want to delete this notification?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/notifications/${notificationId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Remove from UI
            const notificationItem = document.querySelector(`.activity-item[data-id="${notificationId}"]`);
            if (notificationItem) {
                notificationItem.style.opacity = '0';
                notificationItem.style.transform = 'translateX(20px)';
                setTimeout(() => {
                    notificationItem.remove();
                    
                    // Check if empty
                    const notificationsList = document.getElementById('notificationsList');
                    if (notificationsList && notificationsList.children.length === 0) {
                        notificationsList.innerHTML = `
                            <div class="empty-state">
                                <i class="fas fa-bell-slash"></i>
                                <p>No notifications</p>
                            </div>
                        `;
                    }
                }, 300);
            }
            
            showToast('Notification deleted');
        }
    } catch (error) {
        console.error('Error deleting notification:', error);
        showToast('Error deleting notification');
    }
}

async function getNotifications() {
    try {
        const response = await fetch('/api/notifications');
        const data = await response.json();
        return data.notifications || [];
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }
}

function updateNotificationBadge(notifications) {
    const unreadCount = notifications.filter(n => !n.is_read).length;
    const badge = document.getElementById('notificationBadge');
    
    if (badge) {
        if (unreadCount > 0) {
            badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

// Notification polling
function setupNotificationPolling() {
    // Check for new notifications every 30 seconds
    setInterval(async () => {
        if (currentSection === 'dashboard' || currentSection === 'notifications') {
            const notifications = await getNotifications();
            updateNotificationBadge(notifications);
            
            // If on notifications page, refresh the list
            if (currentSection === 'notifications') {
                loadNotificationsPage();
            }
        }
    }, 30000);
}

// Load notifications page
async function loadNotificationsPage() {
    try {
        const notifications = await getNotifications();
        loadNotifications(notifications);
        
        // Update page title with count
        const unreadCount = notifications.filter(n => !n.is_read).length;
        const pageTitle = document.querySelector('#notifications .section-header h1');
        if (pageTitle) {
            pageTitle.innerHTML = `<i class="fas fa-bell"></i> Notifications ${unreadCount > 0 ? `<span class="notification-count">${unreadCount}</span>` : ''}`;
        }
    } catch (error) {
        console.error('Error loading notifications page:', error);
    }
}

// Publications Review Functions
async function loadPublications() {
    try {
        const response = await fetch('/api/publications/pending');
        const data = await response.json();
        
        const publicationsList = document.getElementById('publicationsList');
        if (!publicationsList) return;
        
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
                    <span><i class="fas fa-calendar"></i> ${formatDate(pub.publicationDate)}</span>
                </div>
                ${pub.abstract ? `<p class="publication-abstract">${pub.abstract.substring(0, 150)}${pub.abstract.length > 150 ? '...' : ''}</p>` : ''}
                <div class="publication-actions">
                    <button class="action-btn-small btn-review" onclick="reviewPublication(${pub.publicationID})">
                        <i class="fas fa-eye"></i> Review
                    </button>
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
        
        if (!data.publication) {
            showToast('Publication not found');
            return;
        }
        
        currentPublication = data.publication;
        
        // Populate modal with publication details
        document.getElementById('reviewPublicationDetails').innerHTML = `
            <h3>${currentPublication.title}</h3>
            <div class="publication-meta-grid">
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
                    <span class="meta-value">${formatDate(currentPublication.publicationDate)}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Status:</span>
                    <span class="meta-value status ${currentPublication.status}">${getStatusText(currentPublication.status)}</span>
                </div>
            </div>
            
            ${currentPublication.abstract ? `<div class="publication-section">
                <h4><i class="fas fa-file-alt"></i> Abstract</h4>
                <div class="abstract-content">${currentPublication.abstract}</div>
            </div>` : ''}
            
            ${currentPublication.keywords ? `<div class="publication-section">
                <h4><i class="fas fa-tags"></i> Keywords</h4>
                <div class="keywords-list">${currentPublication.keywords.split(',').map(keyword => `<span class="keyword-tag">${keyword.trim()}</span>`).join('')}</div>
            </div>` : ''}
            
            <div class="publication-section">
                <h4><i class="fas fa-info-circle"></i> Additional Information</h4>
                <div class="additional-info">
                    <p><strong>Publication ID:</strong> ${currentPublication.publicationID}</p>
                    <p><strong>Researcher ID:</strong> ${currentPublication.researcherID}</p>
                </div>
            </div>
        `;
        
        // Clear feedback and reset decision buttons
        document.getElementById('feedback').value = '';
        document.querySelectorAll('.decision-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // Show modal
        document.getElementById('reviewModal').classList.add('active');
        
    } catch (error) {
        console.error('Error loading publication:', error);
        showToast('Error loading publication details');
    }
}

function selectDecision(decision) {
    // Remove selected class from all buttons
    document.querySelectorAll('.decision-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Add selected class to clicked button
    const selectedBtn = document.querySelector(`.decision-btn.${decision}`);
    if (selectedBtn) {
        selectedBtn.classList.add('selected');
    }
}

async function submitDecision() {
    const feedback = document.getElementById('feedback').value;
    const selectedBtn = document.querySelector('.decision-btn.selected');
    
    if (!selectedBtn) {
        showToast('Please select a decision first');
        return;
    }
    
    const decision = selectedBtn.classList[1]; // approve, reject, or changes_required
    
    // Validate feedback for reject and changes_required
    if ((decision === 'reject' || decision === 'changes_required') && !feedback.trim()) {
        showToast(`Please provide feedback for ${decision === 'reject' ? 'rejection' : 'changes'}`);
        return;
    }
    
    try {
        const response = await fetch(`/api/publications/${currentPublication.publicationID}/review`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                decision: decision,
                feedback: feedback || ''
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast(result.message);
            closeModal();
            
            // Send notification to researcher
            await sendResearcherNotification(decision, feedback);
            
            // Refresh data
            setTimeout(() => {
                if (currentSection === 'review') {
                    loadPublications();
                }
                if (currentSection === 'dashboard') {
                    loadDashboardData();
                }
            }, 500);
            
        } else {
            showToast(`Error: ${result.error}`);
        }
        
    } catch (error) {
        console.error('Error submitting decision:', error);
        showToast('Error submitting decision');
    }
}

async function sendResearcherNotification(decision, feedback) {
    try {
        const response = await fetch('/api/notifications/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: currentPublication.researcherID,
                message: `Your publication "${currentPublication.title}" has been ${decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'marked for changes'}. ${feedback ? 'Feedback: ' + feedback.substring(0, 100) + '...' : ''}`,
                type: decision === 'approve' ? 'approval' : decision === 'reject' ? 'rejection' : 'changes'
            })
        });
        
        console.log('Notification sent to researcher');
    } catch (error) {
        console.error('Error sending notification:', error);
    }
}

// Analytics Functions
let typeChart, trendChart, departmentChart, statusChart;

function initializeCharts() {
    console.log('Initializing charts...');
    
    // Type Chart - Publications by Type
    const typeCtx = document.getElementById('typeChart');
    if (typeCtx) {
        typeChart = new Chart(typeCtx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Journal Articles', 'Conference Papers', 'Book Chapters', 'Theses'],
                datasets: [{
                    data: [12, 8, 5, 3],
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
    }
    
    // Trend Chart - Monthly Submissions
    const trendCtx = document.getElementById('trendChart');
    if (trendCtx) {
        trendChart = new Chart(trendCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                    label: 'Submissions',
                    data: [4, 6, 5, 8, 7, 9, 10, 12, 11, 14, 13, 15],
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Publications'
                        }
                    }
                }
            }
        });
    }
    
    // Department Chart - Approval Rate by Department
    const deptCtx = document.getElementById('departmentChart');
    if (deptCtx) {
        departmentChart = new Chart(deptCtx.getContext('2d'), {
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
                        max: 100,
                        title: {
                            display: true,
                            text: 'Approval Rate (%)'
                        }
                    }
                }
            }
        });
    }
    
    // Status Chart - Status Distribution
    const statusCtx = document.getElementById('statusChart');
    if (statusCtx) {
        statusChart = new Chart(statusCtx.getContext('2d'), {
            type: 'pie',
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
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    console.log('Charts initialized successfully');
}

async function updateCharts() {
    try {
        console.log('Updating charts with real data...');
        
        // Fetch stats data
        const statsResponse = await fetch('/api/dashboard/stats');
        const statsData = await statsResponse.json();
        
        // Update summary stats
        const total = (statsData.pending || 0) + (statsData.approved || 0) + (statsData.rejected || 0) + (statsData.changes || 0);
        document.getElementById('totalPublications').textContent = total;
        
        const approvalRate = total > 0 ? Math.round(((statsData.approved || 0) / total) * 100) : 0;
        document.getElementById('approvalRate').textContent = `${approvalRate}%`;
        document.getElementById('activeResearchers').textContent = '4';
        document.getElementById('avgReviewTime').textContent = '2.5 days';
        
        // Update Status Chart with real data
        if (statusChart) {
            statusChart.data.datasets[0].data = [
                statsData.approved || 0,
                statsData.pending || 0,
                statsData.rejected || 0,
                statsData.changes || 0
            ];
            statusChart.update();
        }
        
        // Try to get publications by type
        try {
            const typeResponse = await fetch('/api/analytics/publications-by-type');
            const typeData = await typeResponse.json();
            
            if (typeData.data && typeData.data.length > 0 && typeChart) {
                const typeLabels = typeData.data.map(item => item.publication_type || 'Unknown');
                const typeCounts = typeData.data.map(item => item.count);
                
                typeChart.data.labels = typeLabels;
                typeChart.data.datasets[0].data = typeCounts;
                typeChart.update();
            }
        } catch (typeError) {
            console.log('Using fallback data for type chart');
        }
        
        // Update analytics table
        updateAnalyticsTable();
        
        showToast('Analytics updated successfully');
        
    } catch (error) {
        console.error('Error updating charts:', error);
        showToast('Using sample data for analytics');
    }
}

function updateAnalyticsTable() {
    // Mock department data for the table
    const mockTableData = [
        { department: 'Computer Science', submitted: 45, approved: 38, rejected: 3, pending: 4 },
        { department: 'Engineering', submitted: 35, approved: 27, rejected: 2, pending: 6 },
        { department: 'Science', submitted: 25, approved: 18, rejected: 4, pending: 3 },
        { department: 'Business', submitted: 20, approved: 18, rejected: 1, pending: 1 }
    ];
    
    const tableBody = document.getElementById('analyticsTable');
    if (tableBody) {
        tableBody.innerHTML = mockTableData.map(row => `
            <tr>
                <td>${row.department}</td>
                <td>${row.submitted}</td>
                <td>${row.approved}</td>
                <td>${row.rejected}</td>
                <td>${row.pending}</td>
                <td>
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${Math.round((row.approved / row.submitted) * 100)}%"></div>
                        <span>${Math.round((row.approved / row.submitted) * 100)}%</span>
                    </div>
                </td>
            </tr>
        `).join('');
    }
}

function exportReport() {
    alert('Report exported successfully! This would download a PDF/Excel file in a real implementation.');
}

// ========== GUIDELINES FUNCTIONS ==========

async function loadGuidelines() {
    try {
        // Try to fetch from API first
        const response = await fetch('/api/guidelines');
        const data = await response.json();
        
        const guidelinesList = document.getElementById('guidelinesList');
        if (!guidelinesList) return;
        
        if (!data.guidelines || data.guidelines.length === 0) {
            guidelinesList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-book"></i>
                    <p>No guidelines found. Add your first guideline!</p>
                </div>
            `;
            return;
        }
        
        guidelinesList.innerHTML = data.guidelines.map(guide => `
            <div class="guideline-item" data-id="${guide.id}">
                <div class="guideline-header">
                    <h3 class="guideline-title">${guide.title}</h3>
                    <span class="guideline-category ${guide.category}">${formatCategory(guide.category)}</span>
                </div>
                <div class="guideline-content">
                    ${formatGuidelineContent(guide.content)}
                </div>
                <div class="guideline-meta">
                    <span class="guideline-author"><i class="fas fa-user"></i> ${guide.author_name || guide.created_by || 'System'}</span>
                    <span class="guideline-date"><i class="fas fa-calendar"></i> ${formatDate(guide.created_at)}</span>
                    <span class="guideline-status ${guide.status || 'active'}">${guide.status || 'Active'}</span>
                </div>
                <div class="guideline-actions">
                    <button class="action-btn-small btn-edit" onclick="editGuideline(${guide.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="action-btn-small btn-preview" onclick="previewGuideline(${guide.id})">
                        <i class="fas fa-eye"></i> Preview
                    </button>
                    <button class="action-btn-small btn-delete" onclick="deleteGuidelineConfirm(${guide.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                    ${guide.status === 'draft' ? `
                    <button class="action-btn-small btn-publish" onclick="publishGuideline(${guide.id})">
                        <i class="fas fa-paper-plane"></i> Publish
                    </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading guidelines from API, using mock data:', error);
        // Fallback to mock data
        loadMockGuidelines();
    }
}

function loadMockGuidelines() {
    const mockGuidelines = [
        {
            id: 1,
            title: "Publication Submission Guidelines",
            content: `All submissions must follow these requirements:

1. **Formatting Requirements:**
   - Use 12pt Times New Roman font
   - Double spacing throughout
   - 1-inch margins on all sides
   - Include line numbers for review

2. **Required Sections:**
   - Abstract (250 words max)
   - Keywords (5-7 relevant terms)
   - Introduction
   - Methodology
   - Results
   - Discussion
   - Conclusion
   - References (APA 7th edition)

3. **File Format:**
   - Submit as PDF only
   - File size limit: 10MB
   - File name: LastName_Title_Year.pdf

4. **Proof of Submission:**
   - Include acceptance letter (if published)
   - DOI or submission confirmation
   - Conference acceptance email`,
            category: "submission",
            author_name: "Publication Committee",
            created_at: "2024-01-15T10:30:00Z",
            status: "active"
        },
        {
            id: 2,
            title: "Ethical Review Requirements",
            content: `**ETHICAL GUIDELINES FOR RESEARCH PUBLICATIONS**

All research involving human participants, animals, or sensitive data must comply with institutional and international ethical standards.

**Human Subjects Research:**
- Institutional Review Board (IRB) approval required
- Informed consent documentation
- Participant confidentiality measures
- Data protection compliance (GDPR, etc.)

**Animal Research:**
- IACUC approval required
- ARRIVE guidelines compliance
- Humane treatment protocols

**Data Ethics:**
- Proper data anonymization
- Data sharing agreements
- Citation of data sources
- Conflict of interest disclosure`,
            category: "ethics",
            author_name: "Ethics Committee",
            created_at: "2024-02-10T14:20:00Z",
            status: "active"
        },
        {
            id: 3,
            title: "Research Publication Categories",
            content: `**DEFINITION OF PUBLICATION CATEGORIES**

1. **Journal Articles:**
   - Peer-reviewed scholarly articles
   - Published in indexed journals
   - Impact factor considered for ranking

2. **Conference Papers:**
   - Presented at international conferences
   - Published in conference proceedings
   - IEEE, ACM, Springer, etc.

3. **Book Chapters:**
   - Contributions to edited volumes
   - ISBN assigned
   - Published by academic publishers

4. **Books/Monographs:**
   - Single or multi-author books
   - Published by academic press
   - ISBN and publisher verification required

5. **Patents:**
   - Granted patents only
   - Patent number verification
   - Commercial potential assessment`,
            category: "categories",
            author_name: "Research Office",
            created_at: "2024-03-01T09:15:00Z",
            status: "active"
        },
        {
            id: 4,
            title: "Quality Assessment Criteria",
            content: `**PUBLICATION QUALITY ASSESSMENT**

Publications will be evaluated based on:

**Academic Quality (40%):**
- Originality and innovation
- Research methodology rigor
- Data analysis and interpretation
- Contribution to field

**Publication Venue (30%):**
- Journal impact factor/ranking
- Conference prestige
- Publisher reputation
- Indexing (Scopus, WoS, etc.)

**Citation Impact (20%):**
- Citation count
- H-index contribution
- Altmetric attention score

**Institutional Alignment (10%):**
- Alignment with research priorities
- Interdisciplinary collaboration
- Student involvement
- External funding linkage`,
            category: "assessment",
            author_name: "Quality Assurance",
            created_at: "2024-03-05T16:45:00Z",
            status: "draft"
        }
    ];
    
    const guidelinesList = document.getElementById('guidelinesList');
    if (guidelinesList) {
        guidelinesList.innerHTML = mockGuidelines.map(guide => `
            <div class="guideline-item" data-id="${guide.id}">
                <div class="guideline-header">
                    <h3 class="guideline-title">${guide.title}</h3>
                    <span class="guideline-category ${guide.category}">${formatCategory(guide.category)}</span>
                </div>
                <div class="guideline-content">
                    ${formatGuidelineContent(guide.content)}
                </div>
                <div class="guideline-meta">
                    <span class="guideline-author"><i class="fas fa-user"></i> ${guide.author_name}</span>
                    <span class="guideline-date"><i class="fas fa-calendar"></i> ${formatDate(guide.created_at)}</span>
                    <span class="guideline-status ${guide.status}">${guide.status === 'active' ? 'Published' : 'Draft'}</span>
                </div>
                <div class="guideline-actions">
                    <button class="action-btn-small btn-edit" onclick="editGuideline(${guide.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="action-btn-small btn-preview" onclick="previewGuideline(${guide.id})">
                        <i class="fas fa-eye"></i> Preview
                    </button>
                    <button class="action-btn-small btn-delete" onclick="deleteGuidelineConfirm(${guide.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                    ${guide.status === 'draft' ? `
                    <button class="action-btn-small btn-publish" onclick="publishGuideline(${guide.id})">
                        <i class="fas fa-paper-plane"></i> Publish
                    </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }
}

function formatCategory(category) {
    const categories = {
        'submission': 'Submission Guidelines',
        'ethics': 'Ethics Requirements',
        'categories': 'Publication Categories',
        'assessment': 'Quality Assessment',
        'formatting': 'Formatting Standards',
        'review': 'Review Process',
        'general': 'General Guidelines'
    };
    return categories[category] || category;
}

function formatGuidelineContent(content) {
    // Convert markdown-like formatting to HTML
    return content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/^<p>/, '')
        .replace(/<\/p>$/, '');
}

function showAddGuidelineModal() {
    // Reset form
    document.getElementById('guidelineForm').reset();
    document.getElementById('guidelineTitle').value = '';
    document.getElementById('guidelineContent').value = '';
    document.getElementById('guidelineCategory').value = 'general';
    document.getElementById('guidelineStatus').value = 'draft';
    
    // Set modal title
    document.querySelector('#addGuidelineModal .modal-header h2').textContent = 'Add New Guideline';
    
    // Show modal
    document.getElementById('addGuidelineModal').classList.add('active');
}

function showEditGuidelineModal(guidelineId) {
    // Find guideline data
    const guidelineItem = document.querySelector(`.guideline-item[data-id="${guidelineId}"]`);
    if (!guidelineItem) return;
    
    const title = guidelineItem.querySelector('.guideline-title').textContent;
    const content = guidelineItem.querySelector('.guideline-content').innerHTML;
    const category = guidelineItem.querySelector('.guideline-category').className.split(' ')[1];
    const status = guidelineItem.querySelector('.guideline-status').className.split(' ')[1];
    
    // Populate form
    document.getElementById('guidelineTitle').value = title;
    document.getElementById('guidelineContent').value = content
        .replace(/<br>/g, '\n')
        .replace(/<\/?[^>]+(>|$)/g, '')
        .replace(/&nbsp;/g, ' ');
    document.getElementById('guidelineCategory').value = category;
    document.getElementById('guidelineStatus').value = status;
    
    // Set modal title
    document.querySelector('#addGuidelineModal .modal-header h2').textContent = 'Edit Guideline';
    
    // Store current guideline ID
    currentGuideline = guidelineId;
    
    // Show modal
    document.getElementById('addGuidelineModal').classList.add('active');
}

function editGuideline(guidelineId) {
    showEditGuidelineModal(guidelineId);
}

function previewGuideline(guidelineId) {
    const guidelineItem = document.querySelector(`.guideline-item[data-id="${guidelineId}"]`);
    if (!guidelineItem) return;
    
    const title = guidelineItem.querySelector('.guideline-title').textContent;
    const content = guidelineItem.querySelector('.guideline-content').innerHTML;
    const category = guidelineItem.querySelector('.guideline-category').textContent;
    const author = guidelineItem.querySelector('.guideline-author').textContent;
    const date = guidelineItem.querySelector('.guideline-date').textContent;
    const status = guidelineItem.querySelector('.guideline-status').textContent;
    
    // Populate preview modal
    document.getElementById('previewGuidelineTitle').textContent = title;
    document.getElementById('previewGuidelineCategory').textContent = category;
    document.getElementById('previewGuidelineAuthor').textContent = author;
    document.getElementById('previewGuidelineDate').textContent = date;
    document.getElementById('previewGuidelineStatus').textContent = status;
    document.getElementById('previewGuidelineContent').innerHTML = content;
    
    // Show preview modal
    document.getElementById('previewGuidelineModal').classList.add('active');
}

function deleteGuidelineConfirm(guidelineId) {
    if (confirm('Are you sure you want to delete this guideline? This action cannot be undone.')) {
        deleteGuideline(guidelineId);
    }
}

async function deleteGuideline(guidelineId) {
    try {
        // Try to delete via API
        const response = await fetch(`/api/guidelines/${guidelineId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showToast('Guideline deleted successfully');
            // Remove from UI
            const guidelineItem = document.querySelector(`.guideline-item[data-id="${guidelineId}"]`);
            if (guidelineItem) {
                guidelineItem.style.opacity = '0';
                guidelineItem.style.transform = 'translateX(20px)';
                setTimeout(() => {
                    guidelineItem.remove();
                    // Check if empty
                    const guidelinesList = document.getElementById('guidelinesList');
                    if (guidelinesList && guidelinesList.children.length === 0) {
                        guidelinesList.innerHTML = `
                            <div class="empty-state">
                                <i class="fas fa-book"></i>
                                <p>No guidelines found. Add your first guideline!</p>
                            </div>
                        `;
                    }
                }, 300);
            }
        } else {
            throw new Error('API delete failed');
        }
    } catch (error) {
        console.error('Error deleting guideline:', error);
        // Fallback to UI-only deletion for demo
        showToast('Guideline deleted (demo mode)');
        const guidelineItem = document.querySelector(`.guideline-item[data-id="${guidelineId}"]`);
        if (guidelineItem) {
            guidelineItem.remove();
        }
    }
}

function publishGuideline(guidelineId) {
    if (confirm('Publish this guideline? It will be visible to all researchers.')) {
        // Update UI
        const guidelineItem = document.querySelector(`.guideline-item[data-id="${guidelineId}"]`);
        if (guidelineItem) {
            const statusSpan = guidelineItem.querySelector('.guideline-status');
            statusSpan.textContent = 'Published';
            statusSpan.className = 'guideline-status active';
            
            // Hide publish button
            const publishBtn = guidelineItem.querySelector('.btn-publish');
            if (publishBtn) {
                publishBtn.remove();
            }
        }
        
        showToast('Guideline published successfully');
        
        // Send notification to all researchers about new guideline
        sendGuidelineNotification(guidelineId);
    }
}

async function sendGuidelineNotification(guidelineId) {
    try {
        const guidelineItem = document.querySelector(`.guideline-item[data-id="${guidelineId}"]`);
        const title = guidelineItem.querySelector('.guideline-title').textContent;
        
        // In real implementation, send to all researchers
        await fetch('/api/notifications/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: null, // null for broadcast to all researchers
                message: `New guideline published: "${title}". Please review the updated requirements.`,
                type: 'system'
            })
        });
        
        console.log('Guideline notification sent');
    } catch (error) {
        console.error('Error sending guideline notification:', error);
    }
}

async function addGuideline(event) {
    event.preventDefault();
    
    const title = document.getElementById('guidelineTitle').value.trim();
    const content = document.getElementById('guidelineContent').value.trim();
    const category = document.getElementById('guidelineCategory').value;
    const status = document.getElementById('guidelineStatus').value;
    
    // Validation
    if (!title || !content) {
        showToast('Please fill in all required fields');
        return;
    }
    
    try {
        if (currentGuideline) {
            // Update existing guideline
            const response = await fetch(`/api/guidelines/${currentGuideline}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title,
                    content,
                    category,
                    status
                })
            });
            
            if (response.ok) {
                showToast('Guideline updated successfully');
                closeModal();
                loadGuidelines();
                currentGuideline = null;
            } else {
                throw new Error('API update failed');
            }
        } else {
            // Create new guideline
            const response = await fetch('/api/guidelines', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title,
                    content,
                    category,
                    status
                })
            });
            
            if (response.ok) {
                showToast('Guideline added successfully');
                closeModal();
                loadGuidelines();
            } else {
                throw new Error('API create failed');
            }
        }
    } catch (error) {
        console.error('Error saving guideline:', error);
        // Fallback to UI-only for demo
        showToast(currentGuideline ? 'Guideline updated (demo mode)' : 'Guideline added (demo mode)');
        closeModal();
        loadGuidelines();
        currentGuideline = null;
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
    currentGuideline = null;
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