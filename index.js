console.log('hello world')
const cors = require('cors');
const path = require('path');
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

// const upload = multer({dest: 'static/publications'});

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
app.use(express.urlencoded({ extended: true })); // ← ADDED THIS LINE

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
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    name TEXT,
    username TEXT UNIQUE,
    password TEXT, 
    email TEXT, 
    role TEXT,
    department TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`;
db.run(userTable_sql);

// AUTOINCREMENT unique id no reusing
publicationTable_sql = 
`CREATE TABLE IF NOT EXISTS publication(
    publicationID INTEGER PRIMARY KEY AUTOINCREMENT, 
    title TEXT,
    status TEXT DEFAULT 'draft',
    researcherID INTEGER, 
    publicationDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    publication_type TEXT,
    department TEXT,
    abstract TEXT,
    keywords TEXT,
    file_path TEXT,
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

const notificationsTableSql = `
    CREATE TABLE IF NOT EXISTS notifications(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        message TEXT,
        type TEXT,
        is_read BOOLEAN DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
`;
db.run(notificationsTableSql);

const reviewHistorySql = `
    CREATE TABLE IF NOT EXISTS review_history(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        publication_id INTEGER,
        coordinator_id INTEGER,
        decision TEXT,
        feedback TEXT,
        reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (publication_id) REFERENCES publication(publicationID),
        FOREIGN KEY (coordinator_id) REFERENCES users(id)
    )
`;
db.run(reviewHistorySql);

// Routes

//Register route (GET + POST)
app.get('/register', (req, res) => {
res.sendFile(path.join(__dirname, 'templates', 'register.html'));
})

app.post('/register', (req, res) => {
const{username,ps,role} = req.body;
//Insert into table
i_sql =  'INSERT INTO users(name, username, password, email, role) VALUES (?,?,?,?,?)';
db.run(i_sql, ['lol',username,ps,'mike@gmail.com', role] ,(err) => {
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

app.post('/researcher' ,upload.any(), (req, res) => {
     const title = req.body.title;
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
i_sql =  'INSERT INTO publication(title, publicationDate, publicationFilePath) VALUES (?,?,?)';
db.run(i_sql, [title,"date",publication_file_path] ,(err) => {
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
// ========== ADD THESE API ENDPOINTS ==========

// Dashboard statistics
app.get('/api/dashboard/stats', (req, res) => {
    const sql = `
        SELECT 
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
            COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
            COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
            COUNT(CASE WHEN status = 'changes_required' THEN 1 END) as changes
        FROM publication
    `;
    
    db.get(sql, [], (err, row) => {
        if (err) {
            console.error('Error getting dashboard stats:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(row || { pending: 0, approved: 0, rejected: 0, changes: 0 });
    });
});

// Recent submissions (last 5)
app.get('/api/publications/recent', (req, res) => {
    const sql = `
        SELECT p.*, u.name as researcher_name
        FROM publication p
        LEFT JOIN users u ON p.researcherID = u.id
        ORDER BY p.publicationDate DESC
        LIMIT 5
    `;
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Error getting recent publications:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ publications: rows || [] });
    });
});

// Pending publications for review
app.get('/api/publications/pending', (req, res) => {
    const sql = `
        SELECT p.*, u.name as researcher_name, u.email
        FROM publication p
        LEFT JOIN users u ON p.researcherID = u.id
        WHERE p.status IN ('pending', 'submitted', 'changes_required')
        ORDER BY p.publicationDate DESC
    `;
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Error getting pending publications:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ publications: rows || [] });
    });
});

// Get single publication by ID
app.get('/api/publications/:id', (req, res) => {
    const sql = `
        SELECT p.*, u.name as researcher_name, u.email, u.department
        FROM publication p
        LEFT JOIN users u ON p.researcherID = u.id
        WHERE p.publicationID = ?
    `;
    
    db.get(sql, [req.params.id], (err, row) => {
        if (err) {
            console.error('Error getting publication:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (!row) {
            return res.status(404).json({ error: 'Publication not found' });
        }
        res.json({ publication: row });
    });
});

// Submit review decision
app.post('/api/publications/:id/review', (req, res) => {
    const { decision, feedback } = req.body;
    const publicationId = req.params.id;
    
    // Validate decision
    const validDecisions = ['approve', 'reject', 'changes_required'];
    if (!validDecisions.includes(decision)) {
        return res.status(400).json({ error: 'Invalid decision' });
    }
    
    // Map decision to status
    const statusMap = {
        'approve': 'approved',
        'reject': 'rejected', 
        'changes_required': 'changes_required'
    };
    
    const newStatus = statusMap[decision];
    
    const sql = 'UPDATE publication SET status = ? WHERE publicationID = ?';
    
    db.run(sql, [newStatus, publicationId], function(err) {
        if (err) {
            console.error('Error updating publication:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        // In a real system, you would:
        // 1. Add to review history table
        // 2. Create notification for researcher
        // 3. Send email notification
        
        res.json({ 
            success: true, 
            message: `Publication ${decision}d successfully` 
        });
    });
});

// Notifications endpoint
app.get('/api/notifications', (req, res) => {
    // For now, return mock notifications
    // In real system, query from notifications table
    const mockNotifications = [
        {
            id: 1,
            message: "New submission from Dr. Sarah Johnson",
            created_at: new Date().toISOString(),
            is_read: false
        },
        {
            id: 2,
            message: "Publication #245 has been resubmitted",
            created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            is_read: false
        }
    ];
    res.json({ notifications: mockNotifications });
});

// Analytics data
app.get('/api/analytics/publications-by-type', (req, res) => {
    const sql = `
        SELECT 
            publication_type,
            COUNT(*) as count
        FROM publication
        WHERE publication_type IS NOT NULL
        GROUP BY publication_type
    `;
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Error getting analytics:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ data: rows || [] });
    });
});

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