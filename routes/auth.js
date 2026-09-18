const express = require('express');
const router = express.Router();
const db = require('../db');

const bcrypt = require('bcrypt');

router.post('/api/register', async (req, res, next) => {
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
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(409).json({ message: 'Пользователь с таким именем уже существует' });
        }
        next(error);
    }
});

router.post('/api/login', async (req, res) => {
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

module.exports = router;