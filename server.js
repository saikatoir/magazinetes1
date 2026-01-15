const express = require('express');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const fs = require('fs');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = 3000;

// 1. DATABASE MIGRATION (Fixes your "Missing Column" Error)
db.serialize(() => {
    db.run(`ALTER TABLE magazines ADD COLUMN price REAL DEFAULT 0.0`, (err) => {
        if (err) console.log("Price column already exists.");
    });
    db.run(`ALTER TABLE magazines ADD COLUMN discount INTEGER DEFAULT 0`, (err) => {
        if (err) console.log("Discount column already exists.");
    });
});

// 2. MIDDLEWARE
app.use(cors({
    origin: 'https://magazinetest.netlify.app',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

app.use(session({
    secret: 'magazine_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } 
}));

// 3. FILE UPLOAD
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

// 4. API ROUTES

// Get All Magazines
app.get('/api/magazines', (req, res) => {
    db.all("SELECT * FROM magazines ORDER BY id DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Admin Protection Middleware
const requireAdmin = (req, res, next) => {
    if (req.session.userId && req.session.isAdmin) {
        next();
    } else {
        res.status(403).json({ error: "Unauthorized" });
    }
};

// Upload Magazine (Admin)
app.post('/api/magazines', requireAdmin, upload.fields([{ name: 'cover', maxCount: 1 }, { name: 'pdf', maxCount: 1 }]), (req, res) => {
    const { title, category, date, readingTime, description, tags, is_discover, price, discount } = req.body;
    
    const coverPath = req.files['cover'] ? '/uploads/' + req.files['cover'][0].filename : '/uploads/default.jpg';
    const pdfPath = req.files['pdf'] ? '/uploads/' + req.files['pdf'][0].filename : null;

    const query = `
        INSERT INTO magazines (
            title, category, cover, pdf_path, date, readingTime, 
            description, tags, is_discover, price, discount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(query, [
        title, category, coverPath, pdfPath, date, readingTime || '15 min',
        description, tags, parseInt(is_discover) || 0, 
        parseFloat(price) || 0.0, parseInt(discount) || 0
    ], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: this.lastID });
    });
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
