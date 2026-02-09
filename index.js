console.log('hello world')

const cors = require('cors');
const path = require('path');
const session = require('express-session');
const multer = require('multer');


//Drop table

// dropsql = 'DROP TABLE users'; // alt db.run("DROP TABLE users");

// db.run(dropsql);

// dropsql = 'DROP TABLE publication'; // alt db.run("DROP TABLE users");

// db.run(dropsql);

// dropsql = 'DROP TABLE proof'; // alt db.run("DROP TABLE users");

// db.run(dropsql);

// file upload storage setup
const fileStorage = multer.diskStorage({
destination: (req, file, cb) => {
    if(file.fieldname === 'publication_file'){
        cb(null, 'static/publications'); 
    } else if (file.fieldname === 'proof_file') {
        cb(null, 'static/proofs');
    }
},
filename: (req, file, cb) => {
    cb(null,file.originalname);
}
});

const upload = multer({
storage: fileStorage
})

// express setup
const express = require('express');
const app = express();

app.use(cors());
app.use('/static', express.static('static'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// session setup
app.use(session({
secret: 'secret-key',
resave: false,
saveUninitialized: false,
}));

// database setup
const sqlite3= require('sqlite3').verbose();
let sql;

// connect to database
const db = new sqlite3.Database("./rpsm.db", sqlite3.OPEN_READWRITE, (err) => {
if (err) return console.error(err.message);
});

// enable foreign keys
db.run("PRAGMA foreign_keys = ON");

// create users table
userTable_sql = 
`CREATE TABLE IF NOT EXISTS users(
id INTEGER PRIMARY KEY, 
name,
username,
password, 
email, 
role)`;
db.run(userTable_sql);

// create publications table
publicationTable_sql = 
`CREATE TABLE IF NOT EXISTS publication(
publicationID INTEGER PRIMARY KEY AUTOINCREMENT, 
title,
abstract,
status DEFAULT pending,
researcherID INTEGER, 
publicationDate DATE,
publicationFilePath,
CONSTRAINT FK_researcher_id FOREIGN KEY (researcherID) REFERENCES users(id)
)`;
db.run(publicationTable_sql);

// create proof table
proofTable_sql = 
`CREATE TABLE IF NOT EXISTS proof(
proofID INTEGER PRIMARY KEY, 
publicationID INTEGER, 
uploadDate DATE,
proofFilePath,
CONSTRAINT FK_publication_id FOREIGN KEY (publicationID) REFERENCES publication(publicationID)
)`;
db.run(proofTable_sql);

// create saved publications table
savedTable_sql =
`CREATE TABLE IF NOT EXISTS saved_publications(
id INTEGER PRIMARY KEY AUTOINCREMENT,
userID INTEGER,
publicationID INTEGER,
CONSTRAINT FK_user FOREIGN KEY (userID) REFERENCES users(id),
CONSTRAINT FK_pub FOREIGN KEY (publicationID) REFERENCES publication(publicationID)
)`;
db.run(savedTable_sql);


// ================= register =================
app.get('/register', (req, res) => {
res.sendFile(path.join(__dirname, 'templates', 'register.html'));
})

app.post('/register', (req, res) => {
const{name,username,ps,role} = req.body;

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
 res.send('User registered');

})
})


// ================= login =================
app.get('/login', (req, res) => {
res.sendFile(path.join(__dirname, 'templates', 'login.html'));
})

app.post('/login', (req, res) => {
    const { username, ps } = req.body;
    
    const auth_sql = 'SELECT * FROM users WHERE username = ?';
    
    db.get(auth_sql, [username], (err, row) => {
        if (err) {
            console.error(err.message);
            return res.send("Database error");
        }

        if (!row) {
            return res.send("User not found");
        }

        if (row.password == ps) {
            req.session.userID = row.id;
            req.session.name = row.name;
            req.session.username = row.username;
            req.session.role = row.role;
            res.send(row.role);
        } else {
            res.send("Wrong password");
        }
    });
});


// update publication status (coordinator)
app.post('/publication/updateStatus', (req, res) => {
    const { publicationID, status } = req.body;

    const sql = `
        UPDATE publication
        SET status = ?
        WHERE publicationID = ?
    `;

    db.run(sql, [status, publicationID], function(err) {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Database error' });
        }

        res.json({ success: true });
    });
});


// ================= profile =================
app.get('/profile', (req, res) => {
res.sendFile(path.join(__dirname, 'templates', 'profile.html'));
})

app.get('/user-info', (req, res) => {
    const user_info  = {
            id: req.session.userID,
            name: req.session.name,
            username: req.session.username,
            role: req.session.role
        }

    res.send({user_info});
});

// update username + password
app.post('/update-profile', (req, res) => {
    const { edit_username, edit_password } = req.body;
    const userID = req.session.userID;

    if (!userID) {
        return res.status(401).json({ error: "Not logged in" });
    }

    const sql = `
        UPDATE users 
        SET username = ?, password = ?
        WHERE id = ?
    `;

    db.run(sql, [edit_username, edit_password, userID], function(err) {
        if (err) {
            console.log("SQL ERROR:", err);
            return res.status(500).json({ error: "Database error" });
        }

        req.session.username = edit_username;
        res.json({ success: true });
    });
});


// ================= admin =================
app.get('/admin', (req, res) => {
res.sendFile(path.join(__dirname, 'templates', 'admin.html'));
});

// get admin dashboard stats
app.get('/admin/stats', (req, res) => {

    const sql = `
        SELECT 
            (SELECT COUNT(*) FROM publication) as totalpublications,
            (SELECT COUNT(*) FROM users WHERE role = 'Student') as totalStudents,
            (SELECT COUNT(*) FROM users WHERE role = 'Researcher') as totalResearchers,
            (SELECT COUNT(*) FROM users WHERE role = 'Programme Coordinator') as totalCoordinators
    `;

    db.get(sql, [], (err, row) => {
        if (err) {
            console.log("STATS ERROR:", err);
            return res.status(500).json({ error: err.message });
        }

        res.json(row);
    });
});

// get all users
app.get('/admin/allUsers', (req, res) => {

sql = 'SELECT* FROM users';
db.all(sql, [], (err, rows) => {
if (err) return console.error(err.message);
res.json(rows);
});
});

// delete user + related data
app.delete('/admin/deleteUser/:id', (req, res) => {

    const usrID = req.params.id;

    db.run(`DELETE FROM saved_publications WHERE userID = ?`, [usrID], function(err) {
        if (err) return res.status(500).json({ error: err.message });

        db.run(`
            DELETE FROM proof
            WHERE publicationID IN (
                SELECT publicationID FROM publication WHERE researcherID = ?
            )
        `, [usrID], function(err) {
            if (err) return res.status(500).json({ error: err.message });

            db.run(`DELETE FROM publication WHERE researcherID = ?`, [usrID], function(err) {
                if (err) return res.status(500).json({ error: err.message });

                db.run(`DELETE FROM users WHERE id = ?`, [usrID], function(err) {
                    if (err) return res.status(500).json({ error: err.message });

                    res.json({ success: true });
                });
            });
        });
    });
});


// ================= programme coordinator =================
app.get('/prog_coord', (req, res) => {
res.sendFile(path.join(__dirname, 'templates', 'progcoordinator.html'));
});


// ================= researcher =================
app.get('/researcher', (req, res) => {
res.sendFile(path.join(__dirname, 'templates', 'researcher.html'));
});

app.post('/researcher' ,upload.any(), (req, res) => {

const title = req.body.title_research;
const abstract = req.body.abstract_research;
const researcher_id = req.session.userID;
const publication_file_path = req.files[0].path;
const proof_file_path = req.files[1].path;
const date = new Date().toISOString();

i_sql =  'INSERT INTO publication(title, abstract, researcherID, publicationDate, publicationFilePath) VALUES (?,?,?,?,?)';
db.run(i_sql, [title, abstract, researcher_id,date,publication_file_path] ,function (err){
if (err) return res.status(500).send('Database error');

const publication_id = this.lastID;

i_sql =  'INSERT INTO proof(publicationID, uploadDate, proofFilePath) VALUES (?,?,?)';
db.run(i_sql, [publication_id,date,proof_file_path] ,function (err) {
if (err) return res.status(500).send('Database error');

res.redirect('/researcher');
})
})
});

// get all publications (used by dashboard + coordinator)
app.get('/researcher/allPublications', (req, res) => {

    const sql = `
        SELECT 
            p.publicationID,
            p.title,
            p.status,
            DATE(p.publicationDate) as publicationDate,
            p.publicationFilePath,
            p.abstract,
            p.researcherID,
            u.name as researcherName
        FROM publication p
        LEFT JOIN users u 
        ON p.researcherID = u.id
    `;

    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).send("DB error");

        const formatted = rows.map(row => ({
            ...row,
            status: row.status
                ? row.status.replace(/_/g, ' ')
                    .replace(/\b\w/g, c => c.toUpperCase())
                : ''
        }));

        res.json(formatted);
    });
});

// researcher stats
app.get('/researcher/stats', (req, res) => {

    const userID = req.session.userID;

    const sql = `
        SELECT
            COUNT(*) as total,
            SUM(CASE WHEN status='approved' THEN 1 ELSE 0 END) as approved,
            SUM(CASE WHEN status='rejected' THEN 1 ELSE 0 END) as rejected
        FROM publication
        WHERE researcherID = ?
    `;

    db.get(sql, [userID], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(row);
    });
});

// delete publication
app.delete('/researcher/deletePublication/:id', (req, res) => {

    const pubID = req.params.id;

    db.run('DELETE FROM proof WHERE publicationID = ?', [pubID], (err) => {
        if (err) return res.status(500).json({ error: "Failed to delete proof" });

        db.run('DELETE FROM publication WHERE publicationID = ?', [pubID], function(err) {
            if (err) return res.status(500).json({ error: "Failed to delete publication" });

            res.json({ success: true });
        });
    });
});


// ================= student =================
app.get('/student', (req, res) => {
res.sendFile(path.join(__dirname, 'templates', 'student.html'));
});


// save publication
app.post('/student/savePublication', (req, res) => {
    const { userID, publicationID } = req.body;

    const sql = `
        INSERT INTO saved_publications (userID, publicationID)
        VALUES (?, ?)
    `;

    db.run(sql, [userID, publicationID], function(err) {
        if (err) return res.status(500).json({ error: 'DB error' });
        res.json({ success: true });
    });
});

// remove saved publication
app.post('/student/removeSavedPublication', (req, res) => {
    const { userID, publicationID } = req.body;

    const sql = `
        DELETE FROM saved_publications
        WHERE userID=? AND publicationID=?
    `;

    db.run(sql, [userID, publicationID], function(err) {
        if (err) return res.status(500).json({ error: 'DB error' });
        res.json({ success: true });
    });
});

// get saved publications
app.get('/student/savedPublications/:userID', (req, res) => {

    const sql = `
        SELECT publicationID
        FROM saved_publications
        WHERE userID=?
    `;

    db.all(sql, [req.params.userID], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});


// ================= extra routes =================

// home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});

// simple test route
app.get('/test', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Server is working!',
        timestamp: new Date().toISOString()
    });
});

// mock user for programme coordinator frontend
app.get('/api/current-user', (req, res) => {
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

// mock pending publications
app.get('/api/publications/pending', (req, res) => {
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

// 404 fallback
app.use((req, res) => {
    res.status(404).send(`
        <h1>404 - Page Not Found</h1>
        <p>The page "${req.url}" was not found.</p>
        <a href="/">Go back to home</a>
    `);
});


app.listen(3000, () => {
console.log('The server is running')
})
