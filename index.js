console.log('hello world')
const cors = require('cors');
const path = require('path');

//express set up 
const express = require('express');
const app = express();
app.use(cors()) ; //allow access from any ip
app.use('/static', express.static('static')); //serving files from static
app.use(express.json()); //converts raw JSON data it into a usable js obj
app.use(express.urlencoded({ extended: true })); // ← ADDED THIS LINE

//db setup
const sqlite3= require('sqlite3').verbose();
let sql;

//connect to DB
const db = new sqlite3.Database("./rpsm.db", sqlite3.OPEN_READWRITE, (err) => {
if (err) return console.error(err.message); // rpms == research publication system management
});

//Drop table
// dropsql = 'DROP TABLE users'; // alt db.run("DROP TABLE users");
// db.run(dropsql);
// dropsql = 'DROP TABLE publication'; // alt db.run("DROP TABLE users");
// db.run(dropsql);
// dropsql = 'DROP TABLE proof'; // alt db.run("DROP TABLE users");
// db.run(dropsql);
//enable forgien keys
db.run("PRAGMA foreign_keys = ON");

//Create tables
userTable_sql = 
`CREATE TABLE IF NOT EXISTS users(
id INTEGER PRIMARY KEY, 
name,
username,
password, 
email, 
role)`;
db.run(userTable_sql);

// AUTOINCREMENT unique id no reusing
publicationTable_sql = 
`CREATE TABLE IF NOT EXISTS publication(
publicationID INTEGER PRIMARY KEY AUTOINCREMENT, 
title,
status,
researcherID INTEGER, 
publicationDate DATE,
CONSTRAINT FK_researcher_id FOREIGN KEY (researcherID) REFERENCES users(id)
)`;
db.run(publicationTable_sql);

proofTable_sql = 
`CREATE TABLE IF NOT EXISTS proof(
proofID INTEGER PRIMARY KEY, 
publicationID INTEGER, 
uploadDate DATE,
CONSTRAINT FK_publication_id FOREIGN KEY (publicationID) REFERENCES publication(publicationID)
)`;
db.run(proofTable_sql);

// Routes

//Register route (GET + POST)
app.get('/register', (req, res) => {
res.sendFile(path.join(__dirname, 'templates', 'register.html'));
})

app.post('/register', (req, res) => {
const{username,ps,role} = req.body;
//Insert into table
i_sql =  'INSERT INTO users(name, username, password, email, role) VALUES (?,?,?,?,?)';
db.run(i_sql, ['ok','lol',username,ps,'mike@gmail.com', role] ,(err) => {
if (err) {
    console.error(err.message);
    return res.status(500).send('Database error');
}
 res.send('User registered'); //send response

})
})

//Login Route (GET + POST)
app.get('/login', (req, res) => {
res.sendFile(path.join(__dirname, 'templates', 'login.html'));

})

app.post('/login', (req, res) => {
    const { username, ps } = req.body;
//query the data
 auth_sql = 'SELECT * FROM users WHERE username = ?';
 db.get(auth_sql, [username], (err, row) => {
 if (err) return console.error("User not found");
 else if (row.password == ps) res.send(row.role)
});
})

//Profile Route (GET + POST)
app.get('/profile', (req, res) => {
res.sendFile(path.join(__dirname, 'templates', 'profile.html'));

})


//Admin Route (GET + POST)
app.get('/admin', (req, res) => {
res.sendFile(path.join(__dirname, 'templates', 'admin.html'));
})

/*Programme Coordinator Route (GET + POST)
app.get('/prog_coord', (req, res) => {
res.sendFile(path.join(__dirname, 'templates', 'progcoordinator.html'));
})*/
app.get('/prog_coord', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'progcoordinator.html'));
});

//Researcher Route (GET + POST)
app.get('/researcher', (req, res) => {
res.sendFile(path.join(__dirname, 'templates', 'researcher.html'));
})

//Student Route (GET + POST)
app.get('/student', (req, res) => {
res.sendFile(path.join(__dirname, 'templates', 'student.html'));
})

// ========== ADDED ROUTES START HERE ==========

// Home route - redirect based on if user is logged in (optional)
app.get('/', (req, res) => {
    res.send(`
        <h1>Academic Publication System</h1>
        <p>Server is running! Choose a page:</p>
        <ul>
            <li><a href="/prog_coord">Programme Coordinator Dashboard</a></li>
            <li><a href="/login">Login</a></li>
            <li><a href="/register">Register</a></li>
            <li><a href="/admin">Admin</a></li>
            <li><a href="/researcher">Researcher</a></li>
            <li><a href="/student">Student</a></li>
        </ul>
        <p><small>Note: Programme Coordinator page is accessible without login for testing</small></p>
    `);
});

// Test route to check if server is working
app.get('/test', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Server is working!',
        timestamp: new Date().toISOString()
    });
});

// API endpoint to get current user (for frontend)
app.get('/api/current-user', (req, res) => {
    // Mock user data for testing Programme Coordinator
    res.json({ 
        user: {
            id: 1,
            name: "Dr. Programme Coordinator",
            username: "coordinator",
            email: "coordinator@university.edu",
            role: "programme_coordinator",
            department: "Computer Science"
        }
    });
});

// API endpoint for mock publications data (for Programme Coordinator frontend)
app.get('/api/publications/pending', (req, res) => {
    // Mock data for Programme Coordinator frontend
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
        }
    ];
    res.json({ publications: mockPublications });
});

// Catch-all for 404 errors (add at the very end, before app.listen)
app.use((req, res) => {
    res.status(404).send(`
        <h1>404 - Page Not Found</h1>
        <p>The page "${req.url}" was not found.</p>
        <a href="/">Go back to home</a>
    `);
});

// ========== ADDED ROUTES END HERE ==========

app.listen(3000, () => {
console.log('The server is running')
})


// //update data
// update_sql= 'UPDATE users SET first_name = ? WHERE id = ?';
// db.run(update_sql, ["Jake", 3], (err) => {
// if (err) return console.error(err.message);
// });
// //Delete data
// delsql = 'DELETE FROM users WHERE first_name = ?';
// db.run(delsql, [''], (err) => {
// if (err) return console.error(err.message);
// });

// //query the data
// sql = 'SELECT* FROM users';
// db.all(sql, [], (err, rows) => {
// if (err) return console.error(err.message);
// rows.forEach((row) => {
// console.log(row);
// });
// });