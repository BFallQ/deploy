require('dotenv').config();

const express = require('express');
const app = express();
const helmet = require('helmet');
const port = process.env.PORT || 3000;
const cors = require('cors');
const authRouter = require('./routes/auth');
const tasksRouter = require('./routes/tasks');

const session = require('express-session');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');

app.use(requestLogger);

app.use(helmet());

app.use(express.json());

app.use(cors());

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(authRouter);
app.use(tasksRouter);

app.use(errorHandler);


app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});