require('dotenv').config();

const express = require('express');
const Database = require('better-sqlite3');
const app = express();
const helmet = require('helmet');
const port = process.env.PORT || 3000;
const cors = require('cors');
const db = new Database('tasks.db');

app.use(helmet());

app.use(express.json());

app.use(cors());

db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL
    )
        `);



app.get('/api/tasks', (req, res) => {
    const tasks = db.prepare('SELECT * FROM tasks').all();
    res.json(tasks);
});

app.post('/api/tasks', (req, res) => {
    const { text } = req.body;

    if (!text || typeof text !== 'string' || text.trim() === '') {
        return res.status(400).json({ message: 'Текст задачи обязателен' });
    }

    try {
        const stmt = db.prepare('INSERT INTO tasks (text) VALUES (?)');
        const result = stmt.run(text.trim());
        res.status(201).json({ id: result.lastInsertRowid, text: text.trim() });
    } catch (error) {
        res.status(400).json({ message: 'Не удалось создать задачу' });
    }
});


app.delete('/api/tasks/:id', (req, res) => {
    const tasks = db.prepare('DELETE FROM tasks WHERE id = ?');
    tasks.run(req.params.id);
    res.json({ message: 'Задача удалена' });
});

app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});