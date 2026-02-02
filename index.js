console.log('hello world')

const sqlite3= require('sqlite3').verbose();
let sql;

//connect to DB
const db = new sqlite3.Database("./test.db", sqlite3.OPEN_READWRITE, (err) => {
if (err) return console.error(err.message);
});
//Create table
// sql = 'CREATE TABLE users(id INTEGER PRIMARY KEY, first_name,last_name,username, password, email)';
// db.run(sql);
//Insert into table
sql =  'INSERT INTO users(first_name, last_name, username, password, email) VALUES (?,?,?,?,?)';
db.run(sql, ['ok','lol','mikeuser','mikepass','mike@gmail.com'] ,(err) => {
if (err) return console.error(err.message);
});

//update data
update_sql= 'UPDATE users SET first_name = ? WHERE id = ?';
db.run(update_sql, ["Jake", 3], (err) => {
if (err) return console.error(err.message);
});
//Delete data
delsql = 'DELETE FROM users WHERE first_name = ?';
db.run(delsql, [''], (err) => {
if (err) return console.error(err.message);
});

//query the data
sql = 'SELECT* FROM users';
db.all(sql, [], (err, rows) => {
if (err) return console.error(err.message);
rows.forEach((row) => {
console.log(row);
});
});

//Drop table
//sql = 'DROP TABLE users'; // alt db.run("DROP TABLE users");

