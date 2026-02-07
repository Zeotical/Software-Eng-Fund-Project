console.log('hello world')
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const multer = require('multer');

const fileStorage = multer.diskStorage({
destination: (req, file, cb) => { //cb == callback
cb(null, 'static/publications'); },
filename: (req, file, cb) => {
cb(null,file.originalname); //or cb(null, new Date().toISOString() + '-' + file.originalname); 
}
});

// const fileFilter = (req, file, cb) => {
// if (
// file.mimetype === 'publication_file/pdf' 
// ) { cb(null, true) }
// else {
// cb(null, false); } 
// }
const upload = multer({
storage: fileStorage //,
// limits: {
// fileSize: 1048576, //1 Mbn 
// },
})
//express set up 
const express = require('express');
const app = express();
app.use(cors()) ; //allow access from any ip
app.use('/static', express.static('static')); //serving files from static
app.use(express.json()); //converts raw JSON data it into a usable js obj
app.use(session({
secret: 'secret-key',
resave: false,
saveUninitialized: false,
}));
// app.use(multer({storage: fileStorage, fileFilter:fileFilter }).single('publication_file'));

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
role,
bio)`;
db.run(userTable_sql);

// AUTOINCREMENT unique id no reusing
publicationTable_sql = 
`CREATE TABLE IF NOT EXISTS publication(
publicationID INTEGER PRIMARY KEY AUTOINCREMENT, 
title,
status DEFAULT pending,
researcherID INTEGER, 
publicationDate DATE,
publicationFilePath,
CONSTRAINT FK_researcher_id FOREIGN KEY (researcherID) REFERENCES users(id)
)`;
db.run(publicationTable_sql);

proofTable_sql = 
`CREATE TABLE IF NOT EXISTS proof(
proofID INTEGER PRIMARY KEY, 
publicationID INTEGER, 
uploadDate DATE,
proofFilePath,
CONSTRAINT FK_publication_id FOREIGN KEY (publicationID) REFERENCES publication(publicationID)
)`;
db.run(proofTable_sql);

// Routes

//Register route (GET + POST)
app.get('/register', (req, res) => {
res.sendFile(path.join(__dirname, 'templates', 'register.html'));
})

app.post('/register', (req, res) => {
const{name,username,ps,role} = req.body;
//Insert into table
i_sql =  'INSERT INTO users(name, username, password, email, role) VALUES (?,?,?,?,?)';
db.run(i_sql, [name,username,ps,'mike@gmail.com', role] ,function(err)  {
if (err) {
    console.error(err.message);
    return res.status(500).send('Database error');
}

req.session.userID = this.lastID; 
req.session.name = name;
req.session.username = username;
req.session.role = role;

console.log(this.lastID);
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
 else if (row.password == ps) {
    req.session.userID = row.id;
    req.session.name = row.name;
    req.session.username = row.username;
    req.session.role = row.role;
    res.send(row.role)}
});
})

//Profile Route (GET + POST)
app.get('/profile', (req, res) => {
res.sendFile(path.join(__dirname, 'templates', 'profile.html'));

})

app.post('/user-info', (req, res) => {
    const user_info  = 
        {
            name: req.session.name,
            username: req.session.username ,
            role: req.session.role
        }

        res.send({user_info});
})


//Admin Route (GET + POST)
app.get('/admin', (req, res) => {
res.sendFile(path.join(__dirname, 'templates', 'admin.html'));
})

//Programme Coordinator Route (GET + POST)
app.get('/prog_coord', (req, res) => {
res.sendFile(path.join(__dirname, 'templates', 'progcoordinator.html'));
})

//Researcher Route (GET + POST)
app.get('/researcher', (req, res) => {
res.sendFile(path.join(__dirname, 'templates', 'researcher.html'));
})

app.post('/researcher' ,upload.any(), (req, res) => {
const title = req.body.title_research;
const researcher_id = req.session.userID;
console.log(researcher_id);
// const  description = req.body.publication_descp;

    // const publication_file = req.file ;
//     if(!publication_file) {
//         return res.status(422).render('researcher', {
//         pageTitle: 'Researcher Dashboard',
//         path: '/researcher',
//         editing: false,
//         hasError: true,
//         product: {
//         title: title,
//         // description: description 
//         },
//         errorMessage: 'Attached file is not a pdf.',
//         validationErrors: []
// });
// }

const publication_file_path = req.files[0].path; //req.file.path is for a single not any

//     const { username, ps } = req.body;
// //query the data
//  auth_sql = 'SELECT * FROM users WHERE username = ?';
//  db.get(auth_sql, [username], (err, row) => {
//  if (err) return console.error("User not found");
//  else if (row.password == ps) res.send(row.role)
// });
//Insert into table
i_sql =  'INSERT INTO publication(title, researcherID, publicationDate, publicationFilePath) VALUES (?,?,?,?)';
db.run(i_sql, [title,researcher_id,"date",publication_file_path] ,(err) => {
if (err) {
    console.error(err.message);
    return res.status(500).send('Database error');
}
 res.send('Publication Uploaded'); //send response

})
})

//Student Route (GET + POST)
app.get('/student', (req, res) => {
res.sendFile(path.join(__dirname, 'templates', 'student.html'));
})

app.listen(3000, () => {
console.log('The server is running')
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
