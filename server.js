const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "blob:", "https:"],
            fontSrc: ["'self'"],
            connectSrc: ["'self'"]
        }
    }
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Middleware
app.use(compression());
app.use(morgan('combined'));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration
app.use(session({
    secret: 'uwa-motorsport-wiki-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true in production with HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// File upload configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let uploadPath = 'uploads/';
        if (file.fieldname === 'document') {
            uploadPath += 'documents/';
        } else if (file.fieldname === 'image') {
            uploadPath += 'images/';
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: function (req, file, cb) {
        if (file.fieldname === 'document') {
            // Allow PDF, DOCX, TXT files
            if (file.mimetype === 'application/pdf' || 
                file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                file.mimetype === 'text/plain') {
                cb(null, true);
            } else {
                cb(new Error('Only PDF, DOCX, and TXT files are allowed for documents'));
            }
        } else if (file.fieldname === 'image') {
            // Allow image files
            if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            } else {
                cb(new Error('Only image files are allowed'));
            }
        } else {
            cb(null, true);
        }
    }
});

// Database initialization
const db = new sqlite3.Database('wiki.db');

db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('guest', 'member', 'manager')),
        subteam TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME
    )`);

    // Pages table
    db.run(`CREATE TABLE IF NOT EXISTS pages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        page_id TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
    )`);

    // Page revisions table
    db.run(`CREATE TABLE IF NOT EXISTS page_revisions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        page_id TEXT NOT NULL,
        content TEXT NOT NULL,
        edited_by INTEGER,
        edited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (edited_by) REFERENCES users(id)
    )`);

    // Uploads table
    db.run(`CREATE TABLE IF NOT EXISTS uploads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_type TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        uploaded_by INTEGER,
        page_id TEXT,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
    )`);

    // Comments table
    db.run(`CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        page_id TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        username TEXT NOT NULL,
        comment TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Insert default users
    const defaultUsers = [
        { username: 'guest', password: 'guest123', role: 'guest', subteam: null },
        { username: 'member', password: 'member123', role: 'member', subteam: 'aero' },
        { username: 'manager', password: 'manager123', role: 'manager', subteam: null }
    ];

    defaultUsers.forEach(user => {
        bcrypt.hash(user.password, 10, (err, hash) => {
            if (!err) {
                db.run(`INSERT OR IGNORE INTO users (username, password_hash, role, subteam) VALUES (?, ?, ?, ?)`,
                    [user.username, hash, user.role, user.subteam]);
            }
        });
    });
});

// Authentication middleware
function requireAuth(req, res, next) {
    if (req.session.userId) {
        next();
    } else {
        res.status(401).json({ error: 'Authentication required' });
    }
}

function requireRole(roles) {
    return function(req, res, next) {
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        db.get('SELECT role FROM users WHERE id = ?', [req.session.userId], (err, row) => {
            if (err || !row) {
                return res.status(401).json({ error: 'User not found' });
            }
            
            if (roles.includes(row.role)) {
                next();
            } else {
                res.status(403).json({ error: 'Insufficient permissions' });
            }
        });
    };
}

// Static files
app.use('/public', express.static('public'));
app.use('/uploads', express.static('uploads'));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Authentication routes
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        bcrypt.compare(password, user.password_hash, (err, isMatch) => {
            if (err || !isMatch) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            
            req.session.userId = user.id;
            req.session.username = user.username;
            req.session.role = user.role;
            req.session.subteam = user.subteam;
            
            // Update last login
            db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
            
            res.json({
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    subteam: user.subteam
                }
            });
        });
    });
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.json({ success: true });
    });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
    db.get('SELECT id, username, role, subteam FROM users WHERE id = ?', [req.session.userId], (err, user) => {
        if (err || !user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    });
});

// Pages API
app.get('/api/pages', requireAuth, (req, res) => {
    db.all('SELECT * FROM pages ORDER BY updated_at DESC', (err, pages) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(pages);
    });
});

app.get('/api/pages/:pageId', requireAuth, (req, res) => {
    const { pageId } = req.params;
    
    db.get('SELECT * FROM pages WHERE page_id = ?', [pageId], (err, page) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (!page) {
            return res.status(404).json({ error: 'Page not found' });
        }
        
        res.json(page);
    });
});

app.post('/api/pages/:pageId', requireAuth, requireRole(['member', 'manager']), (req, res) => {
    const { pageId } = req.params;
    const { title, content } = req.body;
    
    if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
    }
    
    db.run(`INSERT OR REPLACE INTO pages (page_id, title, content, created_by, updated_at) 
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`, 
        [pageId, title, content, req.session.userId], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            
            // Save revision
            db.run(`INSERT INTO page_revisions (page_id, content, edited_by) VALUES (?, ?, ?)`,
                [pageId, content, req.session.userId]);
            
            res.json({ success: true, pageId });
        });
});

// Search API
app.get('/api/search', requireAuth, (req, res) => {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
        return res.json([]);
    }
    
    const searchTerm = `%${q}%`;
    
    db.all(`SELECT page_id, title, content, updated_at FROM pages 
            WHERE title LIKE ? OR content LIKE ? 
            ORDER BY updated_at DESC`, [searchTerm, searchTerm], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        // Process results to include snippets
        const processedResults = results.map(page => {
            const snippet = page.content ? 
                page.content.substring(0, 200) + (page.content.length > 200 ? '...' : '') : 
                '';
            return {
                pageId: page.page_id,
                title: page.title,
                snippet,
                updatedAt: page.updated_at
            };
        });
        
        res.json(processedResults);
    });
});

// File upload API
app.post('/api/upload', requireAuth, requireRole(['member', 'manager']), upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const { pageId } = req.body;
    const fileType = req.file.fieldname === 'document' ? 'document' : 'image';
    
    db.run(`INSERT INTO uploads (filename, original_name, file_path, file_type, file_size, uploaded_by, page_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [req.file.filename, req.file.originalname, req.file.path, fileType, req.file.size, req.session.userId, pageId],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            
            res.json({
                success: true,
                file: {
                    id: this.lastID,
                    filename: req.file.filename,
                    originalName: req.file.originalname,
                    filePath: req.file.path,
                    fileType,
                    fileSize: req.file.size
                }
            });
        });
});

// Get uploads for a page
app.get('/api/pages/:pageId/uploads', requireAuth, (req, res) => {
    const { pageId } = req.params;
    
    db.all('SELECT * FROM uploads WHERE page_id = ? ORDER BY uploaded_at DESC', [pageId], (err, uploads) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(uploads);
    });
});

// Page revisions API
app.get('/api/pages/:pageId/revisions', requireAuth, (req, res) => {
    const { pageId } = req.params;
    
    db.all(`SELECT pr.*, u.username FROM page_revisions pr 
            JOIN users u ON pr.edited_by = u.id 
            WHERE pr.page_id = ? 
            ORDER BY pr.edited_at DESC`, [pageId], (err, revisions) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(revisions);
    });
});

// Restore revision API
app.post('/api/revisions/:revisionId/restore', requireAuth, requireRole(['member', 'manager']), (req, res) => {
    const { revisionId } = req.params;
    
    // First get the revision content
    db.get('SELECT * FROM page_revisions WHERE id = ?', [revisionId], (err, revision) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (!revision) {
            return res.status(404).json({ error: 'Revision not found' });
        }
        
        // Update the main page with the revision content
        db.run(`UPDATE pages SET content = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE page_id = ?`, [revision.content, revision.page_id], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            
            // Create a new revision entry for this restore
            db.run(`INSERT INTO page_revisions (page_id, content, edited_by) VALUES (?, ?, ?)`,
                [revision.page_id, revision.content, req.session.userId]);
            
            res.json({ success: true });
        });
    });
});

// Delete upload API
app.delete('/api/uploads/:uploadId', requireAuth, requireRole(['member', 'manager']), (req, res) => {
    const { uploadId } = req.params;
    
    // Get upload info first
    db.get('SELECT * FROM uploads WHERE id = ?', [uploadId], (err, upload) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (!upload) {
            return res.status(404).json({ error: 'Upload not found' });
        }
        
        // Delete from database
        db.run('DELETE FROM uploads WHERE id = ?', [uploadId], (err) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            
            // Try to delete file from filesystem
            fs.unlink(upload.file_path, (err) => {
                if (err) {
                    console.error('Error deleting file:', err);
                    // Don't fail the request if file deletion fails
                }
            });
            
            res.json({ success: true });
        });
    });
});
// Comments API
app.get('/api/pages/:pageId/comments', requireAuth, (req, res) => {
    const { pageId } = req.params;
    db.all(`SELECT id, page_id, user_id, username, comment, created_at
            FROM comments WHERE page_id = ? ORDER BY created_at DESC`, [pageId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
});

app.post('/api/pages/:pageId/comments', requireAuth, (req, res) => {
    const { pageId } = req.params;
    const { comment } = req.body;
    if (!comment || comment.trim().length === 0) {
        return res.status(400).json({ error: 'Comment cannot be empty' });
    }
    const userId = req.session.userId;
    const username = req.session.username;
    db.run(`INSERT INTO comments (page_id, user_id, username, comment) VALUES (?, ?, ?, ?)`,
        [pageId, userId, username, comment.trim()], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({ id: this.lastID, page_id: pageId, user_id: userId, username, comment: comment.trim() });
        });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`UWA Motorsport Wiki server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to access the wiki`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database connection closed.');
        }
        process.exit(0);
    });
});