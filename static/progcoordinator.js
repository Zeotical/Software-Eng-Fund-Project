// Track current section and selected publication
let currentSection = 'dashboard';
let currentPublication = null;

// Initialize page when loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    loadDashboardData();
    initializeCharts();
    showSection('dashboard');
});

/* NAVIGATION HANDLING */
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

// Show selected section
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add('active');
        currentSection = sectionId;

        if (sectionId === 'review') loadPublications();
        if (sectionId === 'guidelines') loadGuidelines();
    }
}

// Navigate to section programmatically
function navigateTo(sectionId) {
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
    if (navLink) navLink.classList.add('active');
    showSection(sectionId);
}

/* DASHBOARD DATA */
function loadDashboardData() {
    fetch('http://localhost:3000/researcher/allPublications')
    .then(res => res.json())
    .then(data => {

        const pending = data.filter(p => p.status === 'Pending').length;
        const approved = data.filter(p => p.status === 'Approved').length;
        const rejected = data.filter(p => p.status === 'Rejected').length;
        const changes = data.filter(p => p.status === 'Changes Required').length;

        document.getElementById('pendingCount').textContent = pending;
        document.getElementById('approvedCount').textContent = approved;
        document.getElementById('rejectedCount').textContent = rejected;
        document.getElementById('changesCount').textContent = changes;

        const submissionsTable = document.getElementById('recentSubmissions');

        // Show latest 5 submissions
        submissionsTable.innerHTML = data.slice(0,5).map(pub => `
            <tr>
                <td>${pub.title}</td>
                <td>${pub.researcherName || 'Unknown'}</td>
                <td>${pub.publicationDate.split('T')[0]}</td>
                <td><span class="status ${pub.status}">${getStatusText(pub.status)}</span></td>
                <td>
                    <button class="action-btn-small btn-review" onclick="reviewPublication(${pub.publicationID})">
                        Review
                    </button>
                </td>
            </tr>
        `).join('');
    });
}

// Convert status code to readable text
function getStatusText(status) {
    const statusMap = {
        'pending': 'Pending Review',
        'approved': 'Approved',
        'rejected': 'Rejected',
        'changes_required': 'Changes Required'
    };
    return statusMap[status] || status;
}

/* REVIEW PAGE */
function loadPublications() {
    fetch('http://localhost:3000/researcher/allPublications')
    .then(res => res.json())
    .then(data => {
        const list = document.getElementById('publicationsList');

        // Display all publications
        list.innerHTML = data.map(pub => `
            <div class="publication-card">
                <div class="publication-header">
                    <h3>${pub.title}</h3>
                    <span class="status ${pub.status}">${getStatusText(pub.status)}</span>
                </div>

                <div class="publication-meta">
                    <span>${pub.researcherName || 'Unknown'}</span>
                    <span>${pub.publicationDate.split('T')[0]}</span>
                </div>

                <p>${pub.abstract}</p>

                <div class="publication-actions">
                    <button class="action-btn-small btn-review" onclick="reviewPublication(${pub.publicationID})">
                        Review
                    </button>
                    <a class="action-btn-small btn-view"
                       href="http://localhost:3000/${pub.publicationFilePath}"
                       target="_blank">View PDF</a>
                </div>
            </div>
        `).join('');
    });
}

/* REVIEW MODAL */
function reviewPublication(id) {
    fetch('http://localhost:3000/researcher/allPublications')
    .then(res => res.json())
    .then(data => {

        const pub = data.find(p => p.publicationID == id);
        currentPublication = pub;

        // Show publication details in modal
        document.getElementById('reviewPublicationDetails').innerHTML = `
            <h3>${pub.title}</h3>
            <p>${pub.abstract}</p>
            <a href="http://localhost:3000/${pub.publicationFilePath}" target="_blank">View Full Paper</a>
        `;

        document.getElementById('reviewModal').classList.add('active');
    });
}

/* DECISION SYSTEM */
function makeDecision(decision) {
    const buttons = document.querySelectorAll('.decision-btn');
    buttons.forEach(btn => btn.classList.remove('selected'));

    const selectedBtn = document.querySelector(`.decision-btn.${decision}`);
    if (selectedBtn) selectedBtn.classList.add('selected');
}

function submitDecision() {
    const decision = document.querySelector('.decision-btn.selected');
    if (!decision) {
        alert('Select a decision first');
        return;
    }

    const type = decision.classList[1];

    let status = '';
    if (type === 'approve') status = 'approved';
    if (type === 'reject') status = 'rejected';
    if (type === 'request-changes') status = 'changes_required';

    // Send decision update to server
    fetch('http://localhost:3000/publication/updateStatus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicationID: currentPublication.publicationID, status })
    })
    .then(res => res.json())
    .then(() => {
        alert('Decision saved');
        closeModal();
        loadPublications();
        loadDashboardData();
    });
}

/* ANALYTICS CHARTS */
function initializeCharts() {
    fetch('http://localhost:3000/researcher/allPublications')
    .then(res => res.json())
    .then(data => {

        // Count monthly submissions
        const monthlyCounts = new Array(12).fill(0);

        data.forEach(pub => {
            const date = new Date(pub.publicationDate);
            const month = date.getMonth();
            monthlyCounts[month]++;
        });

        const trendCtx = document.getElementById('trendChart').getContext('2d');
        window.trendChart = new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: [
                    'Jan','Feb','Mar','Apr','May','Jun',
                    'Jul','Aug','Sep','Oct','Nov','Dec'
                ],
                datasets: [{
                    label: 'Monthly Submissions',
                    data: monthlyCounts
                }]
            }
        });

        // Count status distribution
        let approved = 0;
        let pending = 0;
        let rejected = 0;
        let changes = 0;

        data.forEach(pub => {
            if (pub.status === 'approved') approved++;
            else if (pub.status === 'pending') pending++;
            else if (pub.status === 'rejected') rejected++;
            else if (pub.status === 'changes_required') changes++;
        });

        const statusCtx = document.getElementById('statusChart').getContext('2d');
        window.statusChart = new Chart(statusCtx, {
            type: 'doughnut',
            data: {
                labels: ['Approved','Pending','Rejected','Changes Required'],
                datasets: [{
                    data: [approved, pending, rejected, changes]
                }]
            }
        });

        // Summary statistics
        document.getElementById('totalPublications').innerText = data.length;

        const reviewed = approved + rejected + changes;
        const approvalRate = reviewed === 0
            ? 0
            : Math.round((approved / reviewed) * 100);

        document.getElementById('approvalRate').innerText = approvalRate + '%';

        const uniqueResearchers = new Set(data.map(p => p.researcherID));
        document.getElementById('activeResearchers').innerText = uniqueResearchers.size;
    });
}

/* GUIDELINES SECTION */
function loadGuidelines() {

    const guidelines = [
        {
            title: "Publication Submission Guidelines",
            content: `All submissions must follow these requirements:

1. Formatting Requirements:
- Use 12pt Times New Roman font
- Double spacing throughout
- 1-inch margins on all sides
- Include line numbers for review

2. Required Sections:
- Abstract (250 words max)
- Keywords (5-7 relevant terms)
- Introduction
- Methodology
- Results
- Discussion
- Conclusion
- References (APA 7th edition)

3. File Format:
- Submit as PDF only
- File size limit: 10MB
- File name: LastName_Title_Year.pdf

4. Proof of Submission:
- Include acceptance letter (if published)
- DOI or submission confirmation
- Conference acceptance email`,
            category: "submission",
            author_name: "Publication Committee",
            created_at: "2024-01-15T10:30:00Z",
            status: "active"
        },
        {
            title: "Ethical Review Requirements",
            content: `ETHICAL GUIDELINES FOR RESEARCH PUBLICATIONS

Human Subjects Research:
- IRB approval required
- Informed consent documentation
- Participant confidentiality measures

Animal Research:
- IACUC approval required
- Humane treatment protocols

Data Ethics:
- Proper data anonymization
- Conflict of interest disclosure`,
            category: "ethics",
            author_name: "Ethics Committee",
            created_at: "2024-02-10T14:20:00Z",
            status: "active"
        },
        {
            title: "Research Publication Categories",
            content: `1. Journal Articles
2. Conference Papers
3. Book Chapters
4. Books/Monographs
5. Patents`,
            category: "categories",
            author_name: "Research Office",
            created_at: "2024-03-01T09:15:00Z",
            status: "active"
        },
        {
            title: "Quality Assessment Criteria",
            content: `Publications will be evaluated based on:

Academic Quality (40%)
Publication Venue (30%)
Citation Impact (20%)
Institutional Alignment (10%)`,
            category: "assessment",
            author_name: "Quality Assurance",
            created_at: "2024-03-05T16:45:00Z",
            status: "active"
        }
    ];

    const container = document.getElementById('guidelinesList');

    container.innerHTML = guidelines.map(g => `
        <div class="guideline-item">
            <h3>${g.title}</h3>
            <p style="white-space: pre-line">${g.content}</p>

            <div class="guideline-meta">
                <span>${g.author_name}</span>
                <span>${g.created_at.split('T')[0]}</span>
                <span>${g.status}</span>
            </div>
        </div>
    `).join('');
}


/* UTILITY FUNCTIONS */
function closeModal() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
}

function logout() { window.location.href = '/login'; }

// Load coordinator info into navbar
fetch('http://localhost:3000/user-info')
.then(res => res.json())
.then(data => {
    document.getElementById('coordinatorName').innerText = data.user_info.name;
    document.getElementById('username').innerText = data.user_info.username;
});

// Redirect to profile page
function profile() {
    window.location.href = '/profile';
}
