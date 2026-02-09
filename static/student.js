// Page state tracking
let currentSection = 'dashboard';
let savedPublications = new Set();

let allApprovedPublications = [];
let CURRENT_USER_ID = null;


// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeNavigation();
    loadDashboardData();
    loadPublications();
    loadSavedPublications();
    loadProfileActivities();
    showSection('dashboard');
    updateSavedCount();
});


// Navigation setup
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

// Switch visible section
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

// Manual navigation helper
function navigateTo(sectionId) {
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
    if (navLink) navLink.classList.add('active');
    showSection(sectionId);
}


// Load dashboard table with approved publications
function loadDashboardData() {
    fetch('http://localhost:3000/researcher/allPublications')
    .then(res => res.json())
    .then(data => {

        const approvedOnly = data.filter(pub => pub.status.toLowerCase() === 'approved');
        const table = document.getElementById('recentPublications');

        table.innerHTML = approvedOnly.slice(0,5).map(pub => `
            <tr>
                <td><strong>${pub.title}</strong></td>
                <td>${pub.researcherName || 'Unknown'}</td>
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


// Load all approved publications
function loadPublications() {
    fetch('http://localhost:3000/researcher/allPublications')
    .then(res => res.json())
    .then(data => {

        allApprovedPublications = data.filter(pub => pub.status.toLowerCase() === 'approved');
        renderPublications(allApprovedPublications);
    });
}


// Render publication cards
function renderPublications(list) {
    const grid = document.getElementById('publicationsGrid');

    grid.innerHTML = list.map(pub => `
        <div class="publication-card">
            <div class="publication-header">
                <h3 class="publication-title">${pub.title}</h3>
                <p class="publication-authors">${pub.researcherName || 'Unknown'}</p>
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
}


// Filter publications by year/author/search
function filterPublications() {
    const year = document.getElementById('filterYear').value;
    const author = document.getElementById('filterAuthor').value.toLowerCase();
    const search = document.getElementById('searchPublications').value.toLowerCase();

    const filtered = allApprovedPublications.filter(pub => {
        const pubYear = new Date(pub.publicationDate).getFullYear().toString();

        const matchesYear = (year === 'all') || (pubYear === year);
        const matchesAuthor = pub.researcherID.toString().toLowerCase().includes(author);
        const matchesSearch =
            pub.title.toLowerCase().includes(search) ||
            pub.abstract.toLowerCase().includes(search);

        return matchesYear && matchesAuthor && matchesSearch;
    });

    renderPublications(filtered);
}


// Filter saved publications
function filterSavedPublications() {
    const year = document.getElementById('savedFilterYear').value;
    const search = document.getElementById('savedSearch').value.toLowerCase();

    fetch('http://localhost:3000/researcher/allPublications')
    .then(res => res.json())
    .then(data => {

        let saved = data.filter(p =>
            savedPublications.has(p.publicationID) &&
            p.status && p.status.toLowerCase() === 'approved'
        );

        if (year !== 'all') {
            saved = saved.filter(pub =>
                new Date(pub.publicationDate).getFullYear().toString() === year
            );
        }

        if (search) {
            saved = saved.filter(pub =>
                pub.title.toLowerCase().includes(search) ||
                pub.abstract.toLowerCase().includes(search)
            );
        }

        renderSavedPublications(saved);
    });
}


// Save/remove publication
function toggleSavePublication(id) {

    if (!CURRENT_USER_ID) {
        alert("User not loaded yet");
        return;
    }

    if (savedPublications.has(id)) {

        fetch('http://localhost:3000/student/removeSavedPublication', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userID: CURRENT_USER_ID,
                publicationID: id
            })
        });

        savedPublications.delete(id);

    } else {

        fetch('http://localhost:3000/student/savePublication', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userID: CURRENT_USER_ID,
                publicationID: id
            })
        });

        savedPublications.add(id);
    }

    loadPublications();
    loadSavedPublications();
    updateSavedCount();
}


// Load saved publications list
function loadSavedPublications() {
    fetch('http://localhost:3000/researcher/allPublications')
    .then(res => res.json())
    .then(data => {

        const saved = data.filter(p =>
            savedPublications.has(p.publicationID) &&
            p.status && p.status.toLowerCase() === 'approved'
        );

        renderSavedPublications(saved);
    });
}


// Render saved publication cards
function renderSavedPublications(saved) {
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
                <p class="publication-authors">${pub.researcherName || 'Unknown'}</p>
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
}


// Update saved count display
function updateSavedCount() {
    document.getElementById('savedCount').textContent =
        `${savedPublications.size} publication saved`;
    document.getElementById('totalSaved').textContent =
        savedPublications.size;
}


// Load current user info + saved publications from DB
fetch('http://localhost:3000/user-info')
.then(res => res.json())
.then(data => {
    CURRENT_USER_ID = data.user_info.id;

    document.getElementById('studentName').innerText = data.user_info.name;
    document.getElementById('username').innerText = data.user_info.username;

    fetch(`http://localhost:3000/student/savedPublications/${CURRENT_USER_ID}`)
    .then(res => res.json())
    .then(rows => {

        rows.forEach(r => {
            savedPublications.add(r.publicationID);
        });

        loadPublications();
        loadSavedPublications();
        updateSavedCount();
    });
});


// Placeholder for profile activity logic
function loadProfileActivities() {}

// Logout redirect
function logout() { window.location.href = '/login'; }

// Profile redirect
function profile() { window.location.href = '/profile'; }
