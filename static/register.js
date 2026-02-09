// Run setup when page loads
document.addEventListener('DOMContentLoaded', () => {

    /* DOM elements for step navigation */
    const form1 = document.getElementById("register_form");
    const form2 = document.getElementById("form2");

    const nextBtn = document.getElementById("next");
    const backBtn = document.getElementById("back");
    const submitBtn = document.getElementById("btn-submit-final");

    const progress = document.getElementById("progress");
    
    /* Password field + toggle icon */
    const passwordInput = document.getElementById("ps");
    const toggleIcon = document.getElementById("toggleIcon");

    /* Step 1 → Step 2 */
    nextBtn.addEventListener('click', () => {
        const name = document.getElementById('name').value;
        const username = document.getElementById('username').value;
        const pass = passwordInput.value;

        // Basic validation
        if (!name || !username || !pass) {
            alert("Please fill in all fields");
            return;
        }

        // Slide to next form
        form1.style.left = "-450px";
        form2.style.left = "40px";
        
        // Move progress bar
        progress.style.width = "320px"; 
    });

    /* Step 2 → Step 1 */
    backBtn.addEventListener('click', () => {
        form1.style.left = "40px";
        form2.style.left = "450px";
        progress.style.width = "160px"; 
    });

    /* Show / hide password */
    toggleIcon.addEventListener('click', () => {
        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            toggleIcon.classList.remove("fa-eye");
            toggleIcon.classList.add("fa-eye-slash");
        } else {
            passwordInput.type = "password";
            toggleIcon.classList.remove("fa-eye-slash");
            toggleIcon.classList.add("fa-eye");
        }
    });

    /* Get selected role */
    function getSelectedRole() {
        const roles = document.getElementsByName('role');
        for (let i = 0; i < roles.length; i++) {
            if (roles[i].checked) {
                return roles[i].value;
            }
        }
        return null;
    }

    /* Submit registration */
    submitBtn.addEventListener('click', (e) => {
        e.preventDefault();

        // Collect form data
        const name = document.getElementById("name").value;
        const username = document.getElementById("username").value;
        const ps = passwordInput.value;
        const role = getSelectedRole();

        // Ensure role is selected
        if (!role) {
            alert("Please select a role to complete registration.");
            return;
        }

        // Show loading state
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        submitBtn.disabled = true;

        // Send data to backend
        fetch('http://localhost:3000/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, username, ps, role })
        })
        .then(response => response.text())
        .then(data => {
            console.log('Response from server', data);

            // If backend returns a role → success
            if (['Admin', 'Student', 'Researcher', 'Programme Coordinator'].includes(data)) {
                alert("Registration Successful! Please login.");
                window.location.assign("/login");
            } else {
                // Show backend error
                alert("Server response: " + data);
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        })
        .catch(err => {
            console.error(err);
            alert("Registration failed. Please check your connection.");
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        });
    });

});


// Second initialization block (form-based submission version)
document.addEventListener('DOMContentLoaded', () => {

    /* DOM elements */
    const form1 = document.getElementById("register_form");
    const form2 = document.getElementById("form2");

    const nextBtn = document.getElementById("next");
    const backBtn = document.getElementById("back");
    
    const progress = document.getElementById("progress");
    const passwordInput = document.getElementById("ps");
    const toggleIcon = document.getElementById("toggleIcon");

    /* Step 1 → Step 2 */
    nextBtn.addEventListener('click', () => {
        const name = document.getElementById('name').value;
        const username = document.getElementById('username').value;
        const pass = passwordInput.value;

        if (!name || !username || !pass) {
            alert("Please fill in all fields");
            return;
        }

        form1.style.left = "-450px";
        form2.style.left = "40px";
        progress.style.width = "320px";
    });

    /* Step 2 → Step 1 */
    backBtn.addEventListener('click', () => {
        form1.style.left = "40px";
        form2.style.left = "450px";
        progress.style.width = "160px";
    });

    /* Toggle password visibility */
    toggleIcon.addEventListener('click', () => {
        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            toggleIcon.classList.remove("fa-eye");
            toggleIcon.classList.add("fa-eye-slash");
        } else {
            passwordInput.type = "password";
            toggleIcon.classList.remove("fa-eye-slash");
            toggleIcon.classList.add("fa-eye");
        }
    });

    /* Get chosen role */
    function getSelectedRole() {
        const roles = document.getElementsByName('role');
        for (let i = 0; i < roles.length; i++) {
            if (roles[i].checked) {
                return roles[i].value;
            }
        }
        return null;
    }

    /* Submit via form submit event */
    form2.addEventListener('submit', (e) => {
        e.preventDefault();

        // Collect form data
        const name = document.getElementById("name").value;
        const username = document.getElementById("username").value;
        const ps = passwordInput.value;
        const role = getSelectedRole();

        if (!role) {
            alert("Please select a role to complete registration.");
            return;
        }

        // Loading state
        const submitBtn = document.getElementById("btn-submit-final");
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        submitBtn.disabled = true;

        // Send to backend
        fetch('http://localhost:3000/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, username, ps, role })
        })
        .then(response => response.text())
        .then(data => {
            console.log('Response from server:', data);

            const cleanData = data.trim();

            // If valid role returned → success
            if (['Admin', 'Student', 'Researcher', 'Programme Coordinator'].includes(cleanData)) {
                alert("Registration Successful!");
                window.location.href = "/login";
            } else {
                // Show error from backend
                alert("Server response: " + cleanData);
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        })
        .catch(err => {
            console.error(err);
            alert("Registration failed. Please check your connection.");
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        });
    });

});
