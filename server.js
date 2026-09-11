require('dotenv').config();

const express = require('express');
const Database = require('better-sqlite3');
const app = express();
const helmet = require('helmet');
const port = process.env.PORT || 3000;
const cors = require('cors');
const db = new Database('tasks.db');

const bcrypt = require('bcrypt');

app.use(helmet());

app.use(express.json());

app.use(cors());

const session = require('express-session');

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));



db.exec(`
    CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
)
    
        `);

db.exec(`
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    user_id INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id)
    )
        `);


app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Логин и пароль обязательны' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const stmt = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
        stmt.run(username, hashedPassword);
        res.status(201).json({ message: 'Пользователь зарегистрирован' });
    } catch (error) {
        res.status(400).json({ message: 'Пользователь с таким именем уже существует' });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

    if (!user) {
        return res.status(401).json({ message: 'Неверный логин или пароль' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
        return res.status(401).json({ message: 'Неверный логин или пароль' });
    }

    req.session.userId = user.id;
    res.json({ message: 'Вход выполнен' });
});

function requireAuth(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Требуется вход' });
    }
    next();
}


app.get('/api/tasks', requireAuth, (req, res) => {
    const tasks = db.prepare('SELECT * FROM tasks WHERE user_id = ?').all(req.session.userId);
    res.json(tasks);
});

app.post('/api/tasks',requireAuth, (req, res) => {
    const { text } = req.body;
    const userId = req.session.userId;

    if (!text || typeof text !== 'string' || text.trim() === '') {
        return res.status(400).json({ message: 'Текст задачи обязателен' });
    }

    try {
        const stmt = db.prepare('INSERT INTO tasks (text, user_id) VALUES (?, ?)');
        const result = stmt.run(text.trim(), userId);
        res.status(201).json({ id: result.lastInsertRowid, text: text.trim() });
    } catch (error) {
        res.status(400).json({ message: 'Не удалось создать задачу' });
    }
});

app.delete('/api/tasks/:id', requireAuth, (req, res) => {
    const tasks = db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?');

    tasks.run(req.params.id, req.session.userId);
    res.json({ message: 'Задача удалена' });
});

app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});