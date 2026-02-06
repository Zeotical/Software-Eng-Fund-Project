console.log('hello world')
const cors = require('cors');
const path = require('path');
const multer = require('multer');

// const fileStorage = multer.diskStorage({
// destination: (req, file, cb) => {
// cb(null, 'images'); },
// filename: (req, file, cb) => {
// cb(null, new Date().toISOString() + '-' + file.originalname); //or cb(null, new Date().toISOString() + '-' + file.originalname); 
// }
// });

// const fileFilter = (req, file, cb) => {
// if (
// file.mimetype === 'publication_file/pdf' 
// ) { cb(null, true) }
// else {
// cb(null, false); } 
// }

const upload = multer({dest: 'static/publications'});
//express set up 
const express = require('express');
const app = express();
app.use(cors()) ; //allow access from any ip
app.use('/static', express.static('static')); //serving files from static
app.use(express.json()); //converts raw JSON data it into a usable js obj

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

//Programme Coordinator Route (GET + POST)
app.get('/prog_coord', (req, res) => {
res.sendFile(path.join(__dirname, 'templates', 'progcoordinator.html'));
})

//Researcher Route (GET + POST)
app.get('/researcher', (req, res) => {
res.sendFile(path.join(__dirname, 'templates', 'researcher.html'));
})

app.post('/researcher' ,upload.any(), (req, res) => {
    const title = req.body;
    const publication_file = req.file ;
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

const publication_file_path = publication_file.path;

//     const { username, ps } = req.body;
// //query the data
//  auth_sql = 'SELECT * FROM users WHERE username = ?';
//  db.get(auth_sql, [username], (err, row) => {
//  if (err) return console.error("User not found");
//  else if (row.password == ps) res.send(row.role)
// });
//Insert into table
i_sql =  'INSERT INTO publication(researcherID, title, publicationDate, publicationFilePath) VALUES (?,?,?)';
db.run(i_sql, ["id", title,"date",publication_file_path] ,(err) => {
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
