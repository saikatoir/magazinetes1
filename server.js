const cors = require('cors');
const express = require('express');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const fs = require('fs');
const db = require('./database');

const app = express();
const cors = require('cors'); //

// Place this right after "const app = express();"
app.use(cors()); // This allows Netlify to access your Render API
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // Serve frontend files
app.use('/uploads', express.static('uploads')); // Serve uploaded images/pdfs

// Session Setup
app.use(session({
    secret: 'magazine_secret_key_change_this',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// File Upload Configuration (Multer)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- API ROUTES ---

// 1. Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
        if (err || !user) return res.status(401).json({ error: "Invalid credentials" });
        
        if (bcrypt.compareSync(password, user.password)) {
            req.session.userId = user.id;
            req.session.isAdmin = user.is_admin;
            return res.json({ success: true, isAdmin: user.is_admin });
        }
        res.status(401).json({ error: "Invalid credentials" });
    });
});

// 2. Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// 3. Get All Magazines
app.get('/api/magazines', (req, res) => {
    // We fetch everything, including the is_discover flag
    db.all("SELECT * FROM magazines ORDER BY id DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const magazines = rows.map(m => ({
            ...m,
            tags: m.tags ? m.tags.split(',') : [],
            // Ensure is_discover is treated as a number
            is_discover: parseInt(m.is_discover) 
        }));
        res.json(magazines);
    });
});
// 4. Get Single Magazine
app.get('/api/magazines/:id', (req, res) => {
    db.get("SELECT * FROM magazines WHERE id = ?", [req.params.id], (err, row) => {
        if (err || !row) return res.status(404).json({ error: "Not found" });
        row.tags = row.tags ? row.tags.split(',') : [];
        res.json(row);
    });
});

// Middleware to protect admin routes
const requireAdmin = (req, res, next) => {
    if (req.session.userId && req.session.isAdmin) {
        next();
    } else {
        res.status(403).json({ error: "Unauthorized" });
    }
};

// 5. Upload New Magazine (Admin Only)
// Inside server.js - Update the POST route
app.post('/api/magazines', requireAdmin, upload.fields([{ name: 'cover', maxCount: 1 }, { name: 'pdf', maxCount: 1 }]), (req, res) => {
    const { title, category, date, readingTime, description, tags, is_discover } = req.body;
    
    const coverPath = req.files['cover'] ? '/uploads/' + req.files['cover'][0].filename : 'resources/mag-covers/default.jpg';
    const pdfPath = req.files['pdf'] ? '/uploads/' + req.files['pdf'][0].filename : null;

    // Save is_discover (ensure it's treated as an integer 0 or 1)
    const showInDiscover = parseInt(is_discover) || 0;

    const stmt = db.prepare(`INSERT INTO magazines (title, category, cover, pdf_path, date, readingTime, rating, description, tags, is_discover) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    
    stmt.run(title, category, coverPath, pdfPath, date, readingTime, 5.0, description, tags, showInDiscover, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: this.lastID });
    });
    stmt.finalize();
});

// 6. Delete Magazine (Admin Only)
app.delete('/api/magazines/:id', requireAdmin, (req, res) => {
    db.run("DELETE FROM magazines WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});


