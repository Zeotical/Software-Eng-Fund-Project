console.log('hello world')
const cors = require('cors');

const path = require('path');

//express set up 
const express = require('express');
const app = express();
app.use(cors()) ; //allow access from any ip
app.use('/static', express.static('static')); //serving files from static
app.use(express.json()); //converts raw JSON data it into a usable js obj

//db setup
const sqlite3= require('sqlite3').verbose();
let sql;

//connect to DB
const db = new sqlite3.Database("./test.db", sqlite3.OPEN_READWRITE, (err) => {
if (err) return console.error(err.message);
});

//Drop table
dropsql = 'DROP TABLE users'; // alt db.run("DROP TABLE users");
db.run(dropsql);

//Create table
c_sql = 'CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, first_name,last_name,username, password, email, role)';
db.run(c_sql);

// Routes

//Register route (GET + POST)
app.get('/register', (req, res) => {
res.sendFile(path.join(__dirname, 'templates', 'register.html'));
})

app.post('/register', (req, res) => {
const{username,ps,role} = req.body;
//Insert into table
i_sql =  'INSERT INTO users(first_name, last_name, username, password, email, role) VALUES (?,?,?,?,?,?)';
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

// //Drop table
// dropsql = 'DROP TABLE users'; // alt db.run("DROP TABLE users");
// db.run(dropsql);
