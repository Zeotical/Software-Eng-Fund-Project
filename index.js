console.log('hello world')
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const multer = require('multer');

const fileStorage = multer.diskStorage({
destination: (req, file, cb) => { //cb == callback
    if(file.fieldname === 'publication_file'){
cb(null, 'static/publications'); 
} else if (file.fieldname === 'proof_file') {
    cb(null, 'static/proofs');
        }
},
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
abstract,
status DEFAULT pending,
researcherID INTEGER, 
publicationDate DATE,
publicationFilePath,
CONSTRAINT FK_researcher_id FOREIGN KEY (researcherID) REFERENCES users(id)
ON DELETE CASCADE
)`;
db.run(publicationTable_sql);

proofTable_sql = 
`CREATE TABLE IF NOT EXISTS proof(
proofID INTEGER PRIMARY KEY, 
publicationID INTEGER, 
uploadDate DATE,
proofFilePath,
CONSTRAINT FK_publication_id FOREIGN KEY (publicationID) REFERENCES publication(publicationID)
ON DELETE CASCADE
)`;
db.run(proofTable_sql);

// ===== SAVED PUBLICATIONS TABLE =====
savedTable_sql =
`CREATE TABLE IF NOT EXISTS saved_publications(
id INTEGER PRIMARY KEY AUTOINCREMENT,
userID INTEGER,
publicationID INTEGER,
CONSTRAINT FK_user FOREIGN KEY (userID) REFERENCES users(id),
CONSTRAINT FK_pub FOREIGN KEY (publicationID) REFERENCES publication(publicationID)
)`;
db.run(savedTable_sql);



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


//Profile Route (GET + POST)
app.get('/profile', (req, res) => {
res.sendFile(path.join(__dirname, 'templates', 'profile.html'));

})

app.get('/user-info', (req, res) => {
    const user_info  = 
        {
            id: req.session.userID,   // ← THIS LINE ADDED
            name: req.session.name,
            username: req.session.username,
            role: req.session.role
        }

    res.send({user_info});
})



//Admin Route (GET + POST)
app.get('/admin', (req, res) => {
res.sendFile(path.join(__dirname, 'templates', 'admin.html'));
})

//Admin stats
app.get('/admin/stats', (req, res) => {

    const sql = `
        SELECT 
            (SELECT COUNT(*) FROM users) as totalUsers,
            (SELECT COUNT(*) FROM publication) as totalpublications

    `
    db.get(sql, [], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row);
    });
});

//Admin stats
app.get('/admin/allUsers', (req, res) => {

sql = 'SELECT* FROM users';
db.all(sql, [], (err, rows) => {
if (err) return console.error(err.message);
res.json(rows);
rows.forEach((row) => {
console.log(row);
});
});

});


// //Delete publication
app.delete('/admin/deleteUser/:id', (req, res) => {

const usrID = req.params.id;
    

delsql = 'DELETE FROM users WHERE id = ?';
db.run(delsql, [usrID], (err) => {
if (err) return console.error(err.message); {
    return res.status(500).send('Database error'); }

res.json({ success: true, message: 'User Deleted' });

});
});

//Programme Coordinator Route (GET + POST)
app.get('/prog_coord', (req, res) => {
res.sendFile(path.join(__dirname, 'templates', 'progcoordinator.html'));
})

//Researcher Route (GET + POST)
app.get('/researcher', (req, res) => {
res.sendFile(path.join(__dirname, 'templates', 'researcher.html'));
})

app.post('/researcher' ,upload.any(), (req, res) => {
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
const title = req.body.title_research;
const abstract = req.body.abstract_research;
const researcher_id = req.session.userID;
const publication_file_path = req.files[0].path;
const proof_file_path = req.files[1].path; 
const date = new Date().toISOString() ;

i_sql =  'INSERT INTO publication(title, abstract, researcherID, publicationDate, publicationFilePath) VALUES (?,?,?,?,?)';
db.run(i_sql, [title, abstract, researcher_id,date,publication_file_path] ,function (err){
if (err) {
    console.error(err.message);
    return res.status(500).send('Database error');
}
const publication_id = this.lastID;

i_sql =  'INSERT INTO proof(publicationID, uploadDate, proofFilePath) VALUES (?,?,?)';
db.run(i_sql, [publication_id,date,proof_file_path] ,function (err) {
if (err) {
    console.error(err.message);
    return res.status(500).send('Database error');
}
res.send('Publication Uploaded'); 

})
})

});

//Researcher Publications
app.get('/researcher/allPublications', (req, res) => {

sql = 'SELECT * FROM publication';
db.all(sql, [], (err, rows) => {
if (err) return console.error(err.message);
res.json(rows);
rows.forEach((row) => {
console.log(row);
});
});

});

// //Delete publication
app.delete('/researcher/deletePublication/:id', (req, res) => {

const pubID = req.params.id;
const deleteProofSql = 'DELETE FROM proof WHERE publicationID = ?';
    
db.run(deleteProofSql, [pubID], (err) => {
    if (err) {
        console.error("Proof Delete Error:", err.message);
        return res.status(500).json({ error: "Failed to delete associated proof" });
    }
delsql = 'DELETE FROM publication WHERE publicationID = ?';
db.run(delsql, [pubID], (err) => {
if (err) return console.error(err.message);
    return res.status(500).send('Database error');

res.json({ success: true, message: 'Publication Deleted' });

});
});
});


app.get('/student', (req, res) => {
res.sendFile(path.join(__dirname, 'templates', 'student.html'));
})

app.listen(3000, () => {
console.log('The server is running')
})

app.post('/student/savePublication', (req, res) => {
    const { userID, publicationID } = req.body;

    const sql = `
        INSERT INTO saved_publications (userID, publicationID)
        VALUES (?, ?)
    `;

    db.run(sql, [userID, publicationID], function(err) {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'DB error' });
        }
        res.json({ success: true });
    });
});

app.post('/student/removeSavedPublication', (req, res) => {
    const { userID, publicationID } = req.body;

    const sql = `
        DELETE FROM saved_publications
        WHERE userID=? AND publicationID=?
    `;

    db.run(sql, [userID, publicationID], function(err) {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'DB error' });
        }
        res.json({ success: true });
    });
});

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

app.get('/test', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Server is working!',
        timestamp: new Date().toISOString()
    });
});

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