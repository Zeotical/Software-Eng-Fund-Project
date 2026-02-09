// Fetch and display admin information
fetch('/user-info')
.then(res => res.json())
.then(data => {
    document.getElementById('adminName').innerText = data.user_info.name;
    document.getElementById('username').innerText = data.user_info.username;
});

// Fetch and display dashboard statistics
fetch('/admin/stats')
.then(res => res.json())
.then(data => {
    document.getElementById('pubCount').innerText = data.totalpublications;
    document.getElementById('studentCount').innerText = data.totalStudents;
    document.getElementById('researcherCount').innerText = data.totalResearchers;
    document.getElementById('coordinatorCount').innerText = data.totalCoordinators;
});

// Load all users into the table
function loadUsers() {
    fetch('/admin/allUsers')
    .then(res => res.json())
    .then(rows => {
        const table = document.getElementById('allUsers');

        table.innerHTML = rows.map(row => `
            <tr>
                <td>${row.id}</td>
                <td>${row.name}</td>
                <td>${row.username}</td>
                <td>${row.role}</td>
                <td>
                    <button onclick="deleteUser(${row.id})">Delete</button>
                </td>
            </tr>
        `).join('');
    });
}

// Load users when page is ready
document.addEventListener('DOMContentLoaded', loadUsers);

// Delete selected user
function deleteUser(id){
    if(confirm("Delete this user?")){
        fetch('/admin/deleteUser/' + id, { method:'DELETE' })
        .then(()=>loadUsers());
    }
}

// Redirect to login page
function logout(){
    window.location.href="/login";
}

// Redirect to profile page
function profile(){
    window.location.href="/profile";
}
