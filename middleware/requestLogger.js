function requestLogger(req, res, next) {
    console.log(`[${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow', hour12: false })}] ${req.method} ${req.originalUrl}`);
    next();
}



module.exports = requestLogger;
