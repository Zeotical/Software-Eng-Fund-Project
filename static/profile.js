// Default dashboard route (fallback)
let dashboardURL = "/student";

// Get logged-in user info and set profile details
fetch('/user-info')
.then(res => res.json())
.then(data => {
    const u = data.user_info;

    console.log("ROLE FROM SESSION:", u.role);

    // Fill profile page fields
    document.getElementById('profile-name').innerText = u.name;
    document.getElementById('profile-username2').innerText = u.username;
    document.getElementById('profile-role').innerText = u.role;
    document.getElementById('profile-role2').innerText = u.role;
    document.getElementById('username').innerText = u.username;

    // Decide which dashboard link to use based on role
    const role = (u.role || "").toLowerCase().trim();

    if (role === "student") {
        dashboardURL = "/student";
    }
    else if (role === "researcher") {
        dashboardURL = "/researcher";
    }
    else if (role === "programme_coordinator" || role === "coordinator") {
        dashboardURL = "/prog_coord";
    }
    else if (role === "admin") {
        dashboardURL = "/admin";
    }

    console.log("Dashboard will go to:", dashboardURL);
});

// Setup page events after load
document.addEventListener('DOMContentLoaded', () => {

    // Dashboard link redirect
    const dashboardLink = document.getElementById('dashboardLink');

    if (dashboardLink) {
        dashboardLink.addEventListener('click', function(e){
            e.preventDefault();
            window.location.href = dashboardURL;
        });
    }

    // Profile update form submission
    const form = document.getElementById('profile_form');

    if (form) {
        form.addEventListener('submit', function(e){
            e.preventDefault();

            const formData = {
                edit_username: this.edit_username.value,
                edit_password: this.edit_password.value
            };

            // Send updated profile data to server
            fetch('/update-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert("Profile updated successfully!");
                    location.reload();
                } else {
                    alert("Update failed");
                }
            })
            .catch(err => {
                console.log(err);
                alert("Update failed");
            });
        });
    }
});

// Logout redirect
function logout(){
    window.location.href = "/login";
}
