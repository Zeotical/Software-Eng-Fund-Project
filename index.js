console.log('hello world')
const cors = require('cors');
const path = require('path');
const fs = require('fs');
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
app.use(express.urlencoded({ extended: true }));
app.use(session({
secret: 'secret-key',
resave: false,
saveUninitialized: false,
}));
//db setup
const sqlite3 = require('sqlite3').verbose();

//connect to DB with reliable path
const dbPath = path.join(__dirname, 'rpsm.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error('Database connection error:', err.message);
        return;
    }
    console.log('Connected to SQLite database successfully');
});

// Enable foreign keys
db.run("PRAGMA foreign_keys = ON");

// ========== CREATE TABLES ==========
function createTables() {
    console.log('Creating database tables...');
    
    db.serialize(() => {
        // Users table
        db.run(`CREATE TABLE IF NOT EXISTS users(
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            name TEXT,
            username TEXT UNIQUE,
            password TEXT, 
            email TEXT, 
            role TEXT,
            department TEXT,
            bio TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error('Error creating users table:', err.message);
            } else {
                console.log('Users table ready');
            }
        });
        
        // Publication table
        db.run(`CREATE TABLE IF NOT EXISTS publication(
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
            ON DELETE CASCADE
        )`, (err) => {
            if (err) {
                console.error('Error creating publication table:', err.message);
            } else {
                console.log('Publication table ready');
            }
        });
        
        // Proof table
        db.run(`CREATE TABLE IF NOT EXISTS proof(
            proofID INTEGER PRIMARY KEY AUTOINCREMENT, 
            publicationID INTEGER, 
            uploadDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            proofFilePath TEXT,
            CONSTRAINT FK_publication_id FOREIGN KEY (publicationID) REFERENCES publication(publicationID)
            ON DELETE CASCADE
        )`, (err) => {
            if (err) {
                console.error('Error creating proof table:', err.message);
            } else {
                console.log('Proof table ready');
            }
        });
        
        // Notifications table
        db.run(`CREATE TABLE IF NOT EXISTS notifications(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            message TEXT,
            type TEXT,
            is_read BOOLEAN DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`, (err) => {
            if (err) {
                console.error('Error creating notifications table:', err.message);
            } else {
                console.log('Notifications table ready');
            }
        });
        
        // Review history table
        db.run(`CREATE TABLE IF NOT EXISTS review_history(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            publication_id INTEGER,
            coordinator_id INTEGER,
            decision TEXT,
            feedback TEXT,
            reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (publication_id) REFERENCES publication(publicationID),
            FOREIGN KEY (coordinator_id) REFERENCES users(id)
        )`, (err) => {
            if (err) {
                console.error('Error creating review_history table:', err.message);
            } else {
                console.log('Review history table ready');
                console.log('All tables created successfully');
                // Populate dummy data after all tables are created
                setTimeout(populateDummyData, 1000);
            }
        });
    });
}

// ========== DUMMY DATA POPULATION ==========

function populateDummyData() {
    console.log('Checking and populating dummy data...');
    
    // Check if users table is empty
    db.get('SELECT COUNT(*) as count FROM users', [], (err, row) => {
        if (err) {
            console.error('Error checking users table:', err.message);
            console.log('Retrying in 2 seconds...');
            setTimeout(populateDummyData, 2000);
            return;
        }
        
        if (row.count === 0) {
            console.log('Populating users table with dummy data...');
            insertUsers();
        } else {
            console.log(`Users table already has ${row.count} records.`);
            checkPublications();
        }
    });
}

function insertUsers() {
    // Insert dummy users
    const users = [
        // Programme Coordinators
        ['Dr. Alice Johnson', 'alicej', 'password123', 'alice.johnson@university.edu', 'programme_coordinator', 'Computer Science'],
        ['Prof. Robert Chen', 'robertc', 'password123', 'robert.chen@university.edu', 'programme_coordinator', 'Engineering'],
        
        // Researchers
        ['Dr. Sarah Wilson', 'sarahw', 'password123', 'sarah.wilson@university.edu', 'researcher', 'Computer Science'],
        ['Prof. Michael Brown', 'michaelb', 'password123', 'michael.brown@university.edu', 'researcher', 'Engineering'],
        ['Dr. Emma Davis', 'emmad', 'password123', 'emma.davis@university.edu', 'researcher', 'Science'],
        ['Prof. James Miller', 'jamesm', 'password123', 'james.miller@university.edu', 'researcher', 'Business'],
        
        // Admin
        ['Admin User', 'admin', 'admin123', 'admin@university.edu', 'admin', 'Administration'],
        
        // Students
        ['John Doe', 'johnd', 'password123', 'john.doe@student.edu', 'student', 'Computer Science'],
        ['Jane Smith', 'janes', 'password123', 'jane.smith@student.edu', 'student', 'Engineering']
    ];
    
    const userSql = 'INSERT INTO users(name, username, password, email, role, department) VALUES (?, ?, ?, ?, ?, ?)';
    
    users.forEach((user, index) => {
        db.run(userSql, user, function(err) {
            if (err) {
                console.error('Error inserting user:', err.message);
            } else if (index === users.length - 1) {
                console.log('Users populated. Inserting publications...');
                insertPublications();
            }
        });
    });
}

function insertPublications() {
    // Get researcher IDs
    db.all('SELECT id FROM users WHERE role = "researcher"', [], (err, researchers) => {
        if (err) {
            console.error('Error getting researchers:', err.message);
            return;
        }
        
        if (researchers.length === 0) {
            console.log('No researchers found to assign publications');
            return;
        }
        
        // Dummy publications
        const publications = [
            // Pending publications
            [
                'Machine Learning in Healthcare: Diagnosis Applications',
                'pending',
                researchers[0].id,
                '2024-03-15 10:30:00',
                'Journal Article',
                'Computer Science',
                'This paper explores machine learning applications in healthcare diagnosis systems...',
                'machine learning, healthcare, diagnosis, AI',
                '/uploads/ml_healthcare.pdf'
            ],
            [
                'Blockchain for Secure Supply Chain Management',
                'pending',
                researchers[1].id,
                '2024-03-14 14:20:00',
                'Conference Paper',
                'Business',
                'Investigating blockchain technology applications in supply chain transparency...',
                'blockchain, supply chain, security, transparency',
                '/uploads/blockchain_supplychain.pdf'
            ],
            [
                'Renewable Energy Systems for Urban Environments',
                'submitted',
                researchers[2].id,
                '2024-03-13 09:15:00',
                'Journal Article',
                'Engineering',
                'Analysis of renewable energy solutions suitable for dense urban areas...',
                'renewable energy, urban, sustainability, solar',
                '/uploads/renewable_urban.pdf'
            ],
            
            // Approved publications
            [
                'Deep Learning Algorithms for Image Recognition',
                'approved',
                researchers[0].id,
                '2024-02-28 11:45:00',
                'Journal Article',
                'Computer Science',
                'Comparative study of deep learning algorithms for image classification tasks...',
                'deep learning, image recognition, CNN, computer vision',
                '/uploads/deep_learning_images.pdf'
            ],
            [
                'Sustainable Building Materials Analysis',
                'approved',
                researchers[2].id,
                '2024-02-20 16:30:00',
                'Journal Article',
                'Engineering',
                'Evaluation of sustainable materials for modern construction projects...',
                'sustainability, construction, materials, green building',
                '/uploads/sustainable_materials.pdf'
            ],
            
            // Rejected publications
            [
                'Quantum Computing Fundamentals',
                'rejected',
                researchers[1].id,
                '2024-03-05 13:10:00',
                'Book Chapter',
                'Computer Science',
                'Introduction to quantum computing principles and applications...',
                'quantum computing, qubits, superposition, entanglement',
                '/uploads/quantum_fundamentals.pdf'
            ],
            
            // Changes required
            [
                'AI Ethics Framework Development',
                'changes_required',
                researchers[3].id,
                '2024-03-10 15:45:00',
                'Journal Article',
                'Business',
                'Proposing an ethical framework for AI development and deployment...',
                'AI ethics, framework, governance, responsibility',
                '/uploads/ai_ethics.pdf'
            ]
        ];
        
        const pubSql = `
            INSERT INTO publication(
                title, status, researcherID, publicationDate, 
                publication_type, department, abstract, keywords, file_path
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        publications.forEach((pub, index) => {
            db.run(pubSql, pub, function(err) {
                if (err) {
                    console.error('Error inserting publication:', err.message);
                } else if (index === publications.length - 1) {
                    console.log('Publications populated. Inserting proofs...');
                    insertProofs();
                }
            });
        });
    });
}

function insertProofs() {
    // Get publication IDs
    db.all('SELECT publicationID FROM publication', [], (err, publications) => {
        if (err) {
            console.error('Error getting publications:', err.message);
            return;
        }
        
        if (publications.length === 0) {
            console.log('No publications found to assign proofs');
            return;
        }
        
        // Insert proofs for each publication
        const proofSql = 'INSERT INTO proof(publicationID, uploadDate, proofFilePath) VALUES (?, ?, ?)';
        
        publications.forEach((pub, index) => {
            const proofData = [
                pub.publicationID,
                new Date(Date.now() - (index * 86400000)).toISOString(),
                `/proofs/publication_${pub.publicationID}_proof.pdf`
            ];
            
            db.run(proofSql, proofData, function(err) {
                if (err) {
                    console.error('Error inserting proof:', err.message);
                } else if (index === publications.length - 1) {
                    console.log('Proofs populated. Inserting notifications...');
                    insertNotifications();
                }
            });
        });
    });
}

function insertNotifications() {
    // Get coordinator IDs
    db.all('SELECT id FROM users WHERE role = "programme_coordinator"', [], (err, coordinators) => {
        if (err) {
            console.error('Error getting coordinators:', err.message);
            return;
        }
        
        if (coordinators.length === 0) {
            console.log('No coordinators found for notifications');
            return;
        }
        
        const notifications = [
            [coordinators[0].id, 'New publication submitted: "Machine Learning in Healthcare"', 'submission', 0],
            [coordinators[0].id, 'Publication #3 requires your review', 'review', 0],
            [coordinators[0].id, 'System maintenance scheduled for Friday, 3 PM', 'system', 1],
            [coordinators[1].id, 'New submission from Engineering department', 'submission', 0],
            [coordinators[1].id, 'Monthly report ready for download', 'system', 1]
        ];
        
        const notifSql = 'INSERT INTO notifications(user_id, message, type, is_read) VALUES (?, ?, ?, ?)';
        
        notifications.forEach((notif, index) => {
            db.run(notifSql, notif, function(err) {
                if (err) {
                    console.error('Error inserting notification:', err.message);
                } else if (index === notifications.length - 1) {
                    console.log('Notifications populated. Inserting review history...');
                    insertReviewHistory();
                }
            });
        });
    });
}

function insertReviewHistory() {
    // Get coordinator and approved/rejected publications
    db.all(`
        SELECT u.id as coordinator_id, p.publicationID as publication_id
        FROM users u
        CROSS JOIN publication p
        WHERE u.role = 'programme_coordinator' 
        AND p.status IN ('approved', 'rejected', 'changes_required')
        LIMIT 5
    `, [], (err, results) => {
        if (err) {
            console.error('Error getting review data:', err.message);
            return;
        }
        
        if (results.length === 0) {
            console.log('No data for review history');
            console.log('✅ Dummy data population complete!');
            return;
        }
        
        const reviewHistory = [
            [results[0].publication_id, results[0].coordinator_id, 'approve', 'Excellent research methodology and findings.'],
            [results[1].publication_id, results[0].coordinator_id, 'approve', 'Well-written paper with practical applications.'],
            [results[2].publication_id, results[0].coordinator_id, 'reject', 'Does not meet journal standards. Lacks original contribution.'],
            [results[3].publication_id, results[1].coordinator_id, 'changes_required', 'Please add more experimental data and revise literature review.'],
            [results[4].publication_id, results[1].coordinator_id, 'approve', 'Strong theoretical framework and clear presentation.']
        ];
        
        const historySql = 'INSERT INTO review_history(publication_id, coordinator_id, decision, feedback) VALUES (?, ?, ?, ?)';
        
        reviewHistory.forEach((history, index) => {
            db.run(historySql, history, function(err) {
                if (err) {
                    console.error('Error inserting review history:', err.message);
                } else if (index === reviewHistory.length - 1) {
                    console.log('✅ Dummy data population complete!');
                    console.log('✅ Database now contains:');
                    console.log('   - 10 users (2 coordinators, 4 researchers, 1 admin, 2 students)');
                    console.log('   - 7 publications with various statuses');
                    console.log('   - Proofs for all publications');
                    console.log('   - 5 notifications');
                    console.log('   - 5 review history records');
                }
            });
        });
    });
}

function checkPublications() {
    db.get('SELECT COUNT(*) as count FROM publication', [], (err, row) => {
        if (err) {
            console.error('Error checking publications:', err.message);
            return;
        }
        
        if (row.count === 0) {
            console.log('Publications table is empty. Inserting dummy data...');
            insertPublications();
        } else {
            console.log(`Publications table already has ${row.count} records.`);
        }
    });
}

// Start table creation
createTables();

// ========== ROUTES ==========

// Register route (GET + POST)
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'register.html'));
});

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
});

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
            res.send(row.role)};
    });
});

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
});

app.get('/user-info', (req, res) => {
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

sql = 'SELECT* FROM users WHERE role != "Admin" ';
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

//Programme Coordinator Route
app.get('/prog_coord', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'progcoordinator.html'));
});

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
});

// ========== API ENDPOINTS ==========

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
        
        // Add to review history
        const historySql = 'INSERT INTO review_history(publication_id, coordinator_id, decision, feedback) VALUES (?, ?, ?, ?)';
        // Using coordinator ID 1 for demo (Dr. Alice Johnson)
        db.run(historySql, [publicationId, 1, decision, feedback || '']);
        
        res.json({ 
            success: true, 
            message: `Publication ${decision}d successfully` 
        });
    });
});

// Notifications endpoint
app.get('/api/notifications', (req, res) => {
    const sql = `
        SELECT * FROM notifications 
        WHERE user_id = 1 OR user_id IS NULL
        ORDER BY created_at DESC
        LIMIT 10
    `;
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Error getting notifications:', err);
            // Return mock notifications as fallback
            const mockNotifications = [
                {
                    id: 1,
                    message: "New publication submitted: 'Machine Learning in Healthcare'",
                    created_at: new Date().toISOString(),
                    is_read: 0
                },
                {
                    id: 2,
                    message: "Publication #3 requires your review",
                    created_at: new Date(Date.now() - 86400000).toISOString(),
                    is_read: 0
                }
            ];
            return res.json({ notifications: mockNotifications });
        }
        res.json({ notifications: rows || [] });
    });
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

// ========== ADDITIONAL ROUTES ==========

// Home route
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
        <p><small>Programme Coordinator page is accessible without login for testing</small></p>
    `);
});

// Test route
app.get('/test', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Server is working!',
        timestamp: new Date().toISOString()
    });
});

// API endpoint for current user (for Programme Coordinator frontend)
app.get('/api/current-user', (req, res) => {
    // For demo, return the first programme coordinator
    const sql = 'SELECT * FROM users WHERE role = "programme_coordinator" LIMIT 1';
    
    db.get(sql, [], (err, row) => {
        if (err || !row) {
            // Return mock data if no coordinator found
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
        } else {
            res.json({ user: row });
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).send(`
        <h1>404 - Page Not Found</h1>
        <p>The page "${req.url}" was not found.</p>
        <a href="/">Go back to home</a>
    `);
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`The server is running on http://localhost:${PORT}`);
    console.log(`Programme Coordinator: http://localhost:${PORT}/prog_coord`);
    console.log(`Test API: http://localhost:${PORT}/test`);
});
