# Academic Publication System

## Overview

The Academic Publication System is a web-based platform developed using Node.js, SQLite, HTML, CSS, and JavaScript. It is designed to help universities manage research publications through a structured workflow involving multiple user roles.
The system allows users to submit, review, manage, and track academic publications in a centralized environment.

---

## Features

### Authentication

* User registration and login
* Session-based authentication
* Role-based dashboard access

### Admin

* View system statistics
* Manage all users
* Delete users and related data

### Researcher

* Submit publications with supporting proof files
* View personal publication statistics
* Delete own submissions

### Student

* Browse available publications
* Save and remove saved publications

### Programme Coordinator

* Review submissions
* Approve or reject publications
* View research guidelines

---

## Folder Structure

```
project-root/
│
├── static/
│   ├── publications/        # uploaded publication files
│   ├── proofs/              # uploaded proof documents
│   ├── styleForUsers.css
│   └── other assets
│
├── templates/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── admin.html
│   ├── researcher.html
│   ├── student.html
│   ├── profile.html
│   └── progcoordinator.html
│
├── rpsm.db                  # SQLite database
├── index.js                 # backend server
└── README.md
```

---

## Installation

1. Install Node.js (version 16 or higher recommended)

2. Install required dependencies:

```
npm install express sqlite3 cors multer express-session
```

3. Start the server:

```
node index.js
```

4. Open in your browser:

```
http://localhost:3000
```

---

## Author

Developed as a university academic project for managing research publications and academic review workflows.

---

## License

This project is intended for educational and academic use only.
