const db = require('../db');
const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const requestLogger = require('../middleware/requestLogger');

router.use(requestLogger);


router.get('/api/tasks', requireAuth, (req, res) => {
    const tasks = db.prepare('SELECT * FROM tasks WHERE user_id = ?').all(req.session.userId);
    res.json(tasks);
});

router.post('/api/tasks',requireAuth, (req, res) => {
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

router.delete('/api/tasks/:id', requireAuth, (req, res) => {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);

    if (!task) {
        return res.status(404).json({ message: 'Задача не найдена' });
    }

    if (task.user_id !== req.session.userId) {
        return res.status(403).json({ message: 'Нельзя удалить задачу другого пользователя' });
    }

    const tasks = db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?');
    tasks.run(req.params.id, req.session.userId);
    res.json({ message: 'Задача удалена' });
});

module.exports = router;