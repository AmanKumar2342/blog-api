const express = require('express');
const cors = require('cors'); // Add this line
const bodyParser = require('body-parser');
const { check, validationResult } = require('express-validator');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors()); // Add this line
app.use(bodyParser.json());
app.use('/uploads', express.static('uploads'));

// MySQL connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err.stack);
        return;
    }
    console.log('Connected to database.');
});

// Middleware for JWT authentication
const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Root route
app.get('/', (req, res) => {
    res.send('Welcome to the Blogging Platform API');
});

// Routes
// User registration
app.post('/register', [
    check('username', 'Username is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hashedPassword], (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ message: 'User registered successfully' });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// User login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (results.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ token });
    });
});

// Create a blog post
app.post('/posts', authenticateToken, async (req, res) => {
    const { title, content } = req.body;
    const authorId = req.user.id;

    db.query('INSERT INTO posts (title, content, author_id) VALUES (?, ?, ?)', [title, content, authorId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: 'Post created successfully' });
    });
});

// Get all blog posts
app.get('/posts', async (req, res) => {
    db.query('SELECT * FROM posts', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// Get a single blog post
app.get('/posts/:id', async (req, res) => {
    const { id } = req.params;

    db.query('SELECT * FROM posts WHERE id = ?', [id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Post not found' });
        }

        res.json(results[0]);
    });
});

// Update a blog post
app.put('/posts/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;
    const authorId = req.user.id;

    db.query('UPDATE posts SET title = ?, content = ? WHERE id = ? AND author_id = ?', [title, content, id, authorId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Post not found or not authorized' });
        }

        res.json({ message: 'Post updated successfully' });
    });
});

// Delete a blog post
app.delete('/posts/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const authorId = req.user.id;

    db.query('DELETE FROM posts WHERE id = ? AND author_id = ?', [id, authorId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Post not found or not authorized' });
        }

        res.json({ message: 'Post deleted successfully' });
    });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

module.exports = app;
