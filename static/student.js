// State Management
let currentSection = 'dashboard';
let savedPublications = new Set([1, 3, 6]);

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    initializeNavigation();
    loadDashboardData();
    loadPublications();
    loadSavedPublications();
    loadProfileActivities();
    showSection('dashboard');
    updateSavedCount();
});

// Navigation functions
function initializeNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('href').substring(1);
            showSection(sectionId);
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add('active');
        currentSection = sectionId;
        switch(sectionId) {
            case 'publications': loadPublications(); break;
            case 'saved': loadSavedPublications(); break;
            case 'profile': loadProfileActivities(); updateSavedCount(); break;
        }
    }
}

function navigateTo(sectionId) {
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
    if (navLink) navLink.classList.add('active');
    showSection(sectionId);
}

// Dashboard Functions
function loadDashboardData() {
    const mockData = {
        recentPublications: [
            {id:1,title:"Machine Learning Approaches for Climate Change Prediction",authors:"Dr. Sarah Johnson, Prof. Michael Chen",year:"2025",type:"Journal Article"},
            {id:2,title:"Quantum Computing: A New Era of Processing Power",authors:"Dr. James Wilson",year:"2024",type:"Conference Paper"},
            {id:3,title:"Sustainable Urban Development in the 21st Century",authors:"Prof. Emily Rodriguez, Dr. David Kim",year:"2025",type:"Book Chapter"},
            {id:4,title:"AI Ethics Framework",authors:"Dr. Robert Kim",year:"2024",type:"Journal Article"},
            {id:5,title:"Neural Network Optimization for Image Recognition",authors:"Alex Johnson, Dr. Sarah Johnson",year:"2025",type:"Thesis"}
        ],
        notifications: [
            {id:1,message:"New publication in Computer Science department",time:"2 hours ago",read:false},
            {id:2,message:"Your saved publication has been updated",time:"1 day ago",read:false},
            {id:3,message:"New publications from your saved authors available",time:"2 days ago",read:true},
            {id:4,message:"System maintenance scheduled for this weekend",time:"3 days ago",read:true},
            {id:5,message:"Welcome to Research Web student portal",time:"1 week ago",read:true}
        ]
    };
    
    const publicationsTable = document.getElementById('recentPublications');
    publicationsTable.innerHTML = mockData.recentPublications.map(pub => `
        <tr>
            <td><strong>${pub.title}</strong></td>
            <td>${pub.authors}</td>
            <td>${pub.year}</td>
            <td>${pub.type}</td>
            <td>
                <button class="action-btn-small btn-primary" onclick="viewPublication(${pub.id})"><i class="fas fa-eye"></i> View</button>
                <button class="action-btn-small ${savedPublications.has(pub.id)?'btn-success':'btn-secondary'}" onclick="toggleSavePublication(${pub.id})">
                    <i class="fas ${savedPublications.has(pub.id)?'fa-bookmark':'fa-bookmark'}"></i> ${savedPublications.has(pub.id)?'Saved':'Save'}
                </button>
            </td>
        </tr>
    `).join('');
    
    const notificationsList = document.getElementById('notificationsList');
    notificationsList.innerHTML = mockData.notifications.map(notif => `
        <div class="activity-item ${notif.read?'':'unread'}">
            <div class="activity-icon"><i class="fas fa-bell"></i></div>
            <div class="activity-content"><p>${notif.message}</p><small>${notif.time}</small></div>
        </div>
    `).join('');
}

function markAllAsRead() {
    document.querySelectorAll('.activity-item.unread').forEach(item => item.classList.remove('unread'));
    showToast('All notifications marked as read');
}

// Publications Functions
function loadPublications() {
    const mockPublications = [
        {id:1,title:"Machine Learning Approaches for Climate Change Prediction",authors:"Dr. Sarah Johnson, Prof. Michael Chen",year:"2025",type:"journal",department:"Computer Science",abstract:"This study explores various machine learning algorithms for predicting climate change patterns."},
        {id:2,title:"Quantum Computing: A New Era of Processing Power",authors:"Dr. James Wilson",year:"2024",type:"conference",department:"Physics",abstract:"An overview of quantum computing principles and their applications."},
        {id:3,title:"Sustainable Urban Development in the 21st Century",authors:"Prof. Emily Rodriguez, Dr. David Kim",year:"2025",type:"book",department:"Urban Planning",abstract:"This chapter examines sustainable urban planning strategies."},
        {id:4,title:"AI Ethics Framework for Autonomous Systems",authors:"Dr. Robert Kim, Dr. Lisa Wang",year:"2024",type:"journal",department:"Computer Science",abstract:"A comprehensive framework for ethical AI development."},
        {id:5,title:"Advanced Neural Network Architectures",authors:"Prof. David Miller",year:"2023",type:"thesis",department:"Engineering",abstract:"Analysis of advanced neural network architectures."},
        {id:6,title:"Blockchain Applications in Healthcare",authors:"Dr. Maria Garcia",year:"2024",type:"conference",department:"Business",abstract:"Exploring blockchain technology applications."},
        {id:7,title:"Data Privacy in Cloud Computing",authors:"Dr. Thomas Lee",year:"2024",type:"journal",department:"Computer Science",abstract:"Study of data privacy challenges in cloud computing."},
        {id:8,title:"Renewable Energy Policy Analysis",authors:"Prof. Sarah Williams",year:"2023",type:"book",department:"Environmental Science",abstract:"Analysis of renewable energy policies."}
    ];
    
    const publicationsGrid = document.getElementById('publicationsGrid');
    publicationsGrid.innerHTML = mockPublications.map(pub => `
        <div class="publication-card" data-year="${pub.year}" data-type="${pub.type}" data-department="${pub.department.toLowerCase().replace(' ','_')}" data-author="${pub.authors.toLowerCase()}">
            <div class="publication-header">
                <h3 class="publication-title">${pub.title}</h3>
                <p class="publication-authors">${pub.authors}</p>
            </div>
            <div class="publication-meta">
                <span class="meta-item"><i class="fas fa-calendar-alt"></i> ${pub.year}</span>
                <span class="meta-item"><i class="fas fa-file-alt"></i> ${getTypeDisplay(pub.type)}</span>
                <span class="meta-item"><i class="fas fa-building"></i> ${pub.department}</span>
            </div>
            <p class="publication-abstract">${pub.abstract}</p>
            <div class="publication-actions">
                <button class="action-btn-small btn-primary" onclick="viewPublication(${pub.id})"><i class="fas fa-eye"></i> View Publication</button>
                <button class="action-btn-small btn-secondary" onclick="downloadPublication(${pub.id})"><i class="fas fa-download"></i> Download PDF</button>
                <button class="action-btn-small ${savedPublications.has(pub.id)?'btn-success':'btn-secondary'}" onclick="toggleSavePublication(${pub.id})">
                    <i class="fas ${savedPublications.has(pub.id)?'fa-bookmark':'fa-bookmark'}"></i> ${savedPublications.has(pub.id)?'Saved':'Save'}
                </button>
            </div>
        </div>
    `).join('');
}

// Saved Publications Functions
function loadSavedPublications() {
    const allPublications = [
        {id:1,title:"Machine Learning Approaches for Climate Change Prediction",authors:"Dr. Sarah Johnson, Prof. Michael Chen",year:"2025",type:"journal",department:"Computer Science",abstract:"This study explores various machine learning algorithms."},
        {id:3,title:"Sustainable Urban Development in the 21st Century",authors:"Prof. Emily Rodriguez, Dr. David Kim",year:"2025",type:"book",department:"Urban Planning",abstract:"This chapter examines sustainable urban planning."},
        {id:6,title:"Blockchain Applications in Healthcare",authors:"Dr. Maria Garcia",year:"2024",type:"conference",department:"Business",abstract:"Exploring blockchain technology applications."}
    ];
    
    const savedPublicationsData = allPublications.filter(pub => savedPublications.has(pub.id));
    const savedGrid = document.getElementById('savedPublicationsGrid');
    const emptyState = document.getElementById('noSavedPublications');
    
    if (savedPublicationsData.length === 0) {
        savedGrid.innerHTML = '';
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
        savedGrid.innerHTML = savedPublicationsData.map(pub => `
            <div class="publication-card saved-publication-card" data-year="${pub.year}" data-type="${pub.type}" data-department="${pub.department.toLowerCase().replace(' ','_')}" data-author="${pub.authors.toLowerCase()}">
                <div class="publication-header">
                    <h3 class="publication-title">${pub.title}</h3>
                    <p class="publication-authors">${pub.authors}</p>
                </div>
                <div class="publication-meta">
                    <span class="meta-item"><i class="fas fa-calendar-alt"></i> ${pub.year}</span>
                    <span class="meta-item"><i class="fas fa-file-alt"></i> ${getTypeDisplay(pub.type)}</span>
                    <span class="meta-item"><i class="fas fa-building"></i> ${pub.department}</span>
                </div>
                <p class="publication-abstract">${pub.abstract}</p>
                <div class="publication-actions">
                    <button class="action-btn-small btn-primary" onclick="viewPublication(${pub.id})"><i class="fas fa-eye"></i> View Publication</button>
                    <button class="action-btn-small btn-secondary" onclick="downloadPublication(${pub.id})"><i class="fas fa-download"></i> Download PDF</button>
                    <button class="action-btn-small btn-danger" onclick="removeFromSaved(${pub.id})"><i class="fas fa-trash"></i> Remove</button>
                </div>
            </div>
        `).join('');
    }
    updateSavedCount();
}

function filterSavedPublications() {
    const searchTerm = document.getElementById('savedSearch').value.toLowerCase();
    const yearFilter = document.getElementById('savedFilterYear').value;
    const typeFilter = document.getElementById('savedFilterType').value;
    
    document.querySelectorAll('#savedPublicationsGrid .publication-card').forEach(card => {
        const title = card.querySelector('.publication-title').textContent.toLowerCase();
        const authors = card.querySelector('.publication-authors').textContent.toLowerCase();
        const year = card.getAttribute('data-year');
        const type = card.getAttribute('data-type');
        const matchesSearch = title.includes(searchTerm) || authors.includes(searchTerm);
        const matchesYear = yearFilter === 'all' || year === yearFilter;
        const matchesType = typeFilter === 'all' || type === typeFilter;
        card.style.display = matchesSearch && matchesYear && matchesType ? 'block' : 'none';
    });
}

function removeFromSaved(id) {
    if (savedPublications.has(id)) {
        savedPublications.delete(id);
        showToast('Publication removed from saved items');
        loadSavedPublications();
        loadDashboardData();
        loadPublications();
        updateSavedCount();
    }
}

function clearAllSaved() {
    if (savedPublications.size === 0) {
        showToast('No saved publications to clear');
        return;
    }
    if (confirm('Remove all saved publications?')) {
        savedPublications.clear();
        showToast('All saved publications removed');
        loadSavedPublications();
        loadDashboardData();
        loadPublications();
        updateSavedCount();
    }
}

function updateSavedCount() {
    const count = savedPublications.size;
    document.getElementById('savedCount').textContent = `${count} publication${count !== 1 ? 's' : ''} saved`;
    document.getElementById('totalSaved').textContent = count;
}

function getTypeDisplay(type) {
    const typeMap = {'journal':'Journal Article','conference':'Conference Paper','book':'Book Chapter','thesis':'Thesis'};
    return typeMap[type] || type;
}

function filterPublications() {
    const searchTerm = document.getElementById('searchPublications').value.toLowerCase();
    const yearFilter = document.getElementById('filterYear').value;
    const typeFilter = document.getElementById('filterType').value;
    const authorFilter = document.getElementById('filterAuthor').value.toLowerCase();
    const deptFilter = document.getElementById('filterDepartment').value;
    
    document.querySelectorAll('#publicationsGrid .publication-card').forEach(card => {
        const title = card.querySelector('.publication-title').textContent.toLowerCase();
        const authors = card.querySelector('.publication-authors').textContent.toLowerCase();
        const year = card.getAttribute('data-year');
        const type = card.getAttribute('data-type');
        const department = card.getAttribute('data-department');
        const matchesSearch = title.includes(searchTerm) || authors.includes(searchTerm);
        const matchesYear = yearFilter === 'all' || year === yearFilter;
        const matchesType = typeFilter === 'all' || type === typeFilter;
        const matchesAuthor = authorFilter === '' || authors.includes(authorFilter);
        const matchesDept = deptFilter === 'all' || department === deptFilter;
        card.style.display = matchesSearch && matchesYear && matchesType && matchesAuthor && matchesDept ? 'block' : 'none';
    });
}

// Profile Functions
function loadProfileActivities() {
    const activities = [
        {id:1,message:"Viewed publication: Machine Learning Approaches for Climate Change Prediction",time:"2 hours ago",icon:"fa-eye"},
        {id:2,message:"Saved publication: Quantum Computing: A New Era of Processing Power",time:"1 day ago",icon:"fa-bookmark"},
        {id:3,message:"Updated profile information",time:"3 days ago",icon:"fa-user-edit"},
        {id:4,message:"Downloaded publication: AI Ethics Framework",time:"2 weeks ago",icon:"fa-download"},
        {id:5,message:"Joined Research Web platform",time:"1 month ago",icon:"fa-user-plus"}
    ];
    
    const activitiesList = document.getElementById('profileActivities');
    activitiesList.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon"><i class="fas ${activity.icon}"></i></div>
            <div class="activity-content"><p>${activity.message}</p><small>${activity.time}</small></div>
        </div>
    `).join('');
}

// Publication Actions
function viewPublication(id) { showToast(`Opening publication #${id}`); }
function downloadPublication(id) { showToast(`Downloading publication #${id} as PDF`); }

function toggleSavePublication(id) {
    if (savedPublications.has(id)) {
        savedPublications.delete(id);
        showToast('Publication removed from saved items');
    } else {
        savedPublications.add(id);
        showToast('Publication saved to your collection');
    }
    updateSavedCount();
    if (currentSection === 'dashboard') loadDashboardData();
    else if (currentSection === 'publications') loadPublications();
    else if (currentSection === 'saved') loadSavedPublications();
    else if (currentSection === 'profile') updateSavedCount();
}

function editProfile() { showToast('Opening profile editor'); }
function changePassword() { const newPassword = prompt('Enter new password:'); if (newPassword) showToast('Password changed successfully'); }

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = 'position:fixed;top:20px;right:20px;background:#4CAF50;color:#fff;padding:15px 25px;border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,.15);z-index:3000;animation:slideIn .3s ease';
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideOut .3s ease';
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
    if (!document.querySelector('#toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = '@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}@keyframes slideOut{from{transform:translateX(0);opacity:1}to{transform:translateX(100%);opacity:0}}';
        document.head.appendChild(style);
    }
}

function logout() { if (confirm('Are you sure you want to logout?')) window.location.href = '/login'; }

//Fetching user info to be displayed
 fetch('http://localhost:3000/user-info', {
    method: 'POST',
    headers: {
'Content-Type': 'application/json'
},
})
.then(response => response.json())
.then(data => {
console.log('Response from server', data)
document.getElementById('studentName').innerText = `${data.user_info.name}`;
document.getElementById('username').innerText = `${data.user_info.username}`;
});

function profile() {
        // In real implementation, call logout API
        window.location.href = '/profile';
}