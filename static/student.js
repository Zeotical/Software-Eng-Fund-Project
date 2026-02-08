// State Management
let currentSection = 'dashboard';
let savedPublications = new Set();

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

// Navigation
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

        if (sectionId === 'publications') loadPublications();
        if (sectionId === 'saved') loadSavedPublications();
    }
}

function navigateTo(sectionId) {
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
    if (navLink) navLink.classList.add('active');
    showSection(sectionId);
}

// =============================
// DASHBOARD - REAL PUBLICATIONS
// =============================
function loadDashboardData() {
    fetch('http://localhost:3000/researcher/allPublications')
    .then(res => res.json())
    .then(data => {
        const table = document.getElementById('recentPublications');

        table.innerHTML = data.slice(0,5).map(pub => `
            <tr>
                <td><strong>${pub.title}</strong></td>
                <td>Researcher ID: ${pub.researcherID}</td>
                <td>${new Date(pub.publicationDate).getFullYear()}</td>
                <td>
                    <a class="action-btn-small btn-primary"
                       href="http://localhost:3000/${pub.publicationFilePath}"
                       target="_blank">
                       View
                    </a>
                </td>
            </tr>
        `).join('');
    });
}


function loadPublications() {
    fetch('http://localhost:3000/researcher/allPublications')
    .then(res => res.json())
    .then(data => {
        const grid = document.getElementById('publicationsGrid');

        grid.innerHTML = data.map(pub => `
            <div class="publication-card">
                <div class="publication-header">
                    <h3 class="publication-title">${pub.title}</h3>
                    <p class="publication-authors">Researcher ID: ${pub.researcherID}</p>
                </div>

                <div class="publication-meta">
                    <span class="meta-item">
                        <i class="fas fa-calendar-alt"></i> 
                        ${new Date(pub.publicationDate).getFullYear()}
                    </span>
                </div>

                <p class="publication-abstract">${pub.abstract}</p>

                <div class="publication-actions">
                    <a class="action-btn-small btn-primary"
                       href="http://localhost:3000/${pub.publicationFilePath}"
                       target="_blank">
                       <i class="fas fa-eye"></i> View
                    </a>

                    <a class="action-btn-small btn-secondary"
                       href="http://localhost:3000/${pub.publicationFilePath}"
                       download>
                       <i class="fas fa-download"></i> Download
                    </a>

                    <button class="action-btn-small ${savedPublications.has(pub.publicationID) ? 'btn-success' : 'btn-secondary'}"
                        onclick="toggleSavePublication(${pub.publicationID})">
                        <i class="fas fa-bookmark"></i>
                        ${savedPublications.has(pub.publicationID) ? 'Saved' : 'Save'}
                    </button>
                </div>
            </div>
        `).join('');
    });
}

function toggleSavePublication(id) {
    if (savedPublications.has(id)) {
        savedPublications.delete(id);
    } else {
        savedPublications.add(id);
    }

    loadPublications();      
    loadSavedPublications(); 
    updateSavedCount();      
}


function loadSavedPublications() {
    fetch('http://localhost:3000/researcher/allPublications')
    .then(res => res.json())
    .then(data => {
        const saved = data.filter(p => savedPublications.has(p.publicationID));
        const grid = document.getElementById('savedPublicationsGrid');
        const empty = document.getElementById('noSavedPublications');

        if (saved.length === 0) {
            grid.innerHTML = '';
            empty.style.display = 'block';
            return;
        }

        empty.style.display = 'none';

        grid.innerHTML = saved.map(pub => `
            <div class="publication-card saved-publication-card">
                <div class="publication-header">
                    <h3 class="publication-title">${pub.title}</h3>
                    <p class="publication-authors">Researcher ID: ${pub.researcherID}</p>
                </div>

                <div class="publication-meta">
                    <span class="meta-item">
                        <i class="fas fa-calendar-alt"></i> 
                        ${new Date(pub.publicationDate).getFullYear()}
                    </span>
                </div>

                <p class="publication-abstract">${pub.abstract}</p>

                <div class="publication-actions">
                    <a class="action-btn-small btn-primary"
                       href="http://localhost:3000/${pub.publicationFilePath}"
                       target="_blank">
                       <i class="fas fa-eye"></i> View
                    </a>

                    <a class="action-btn-small btn-secondary"
                       href="http://localhost:3000/${pub.publicationFilePath}"
                       download>
                       <i class="fas fa-download"></i> Download
                    </a>

                    <button class="action-btn-small btn-danger"
                        onclick="toggleSavePublication(${pub.publicationID})">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                </div>
            </div>
        `).join('');
    });
}


function updateSavedCount() {
    document.getElementById('savedCount').textContent =
        `${savedPublications.size} publication saved`;
    document.getElementById('totalSaved').textContent =
        savedPublications.size;
}


fetch('http://localhost:3000/user-info')
.then(res => res.json())
.then(data => {
    document.getElementById('studentName').innerText = data.user_info.name;
    document.getElementById('username').innerText = data.user_info.username;
});

function loadProfileActivities() {}
function logout() { window.location.href = '/login'; }
function profile() { window.location.href = '/profile'; }
