function requireAuth(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Требуется вход' });
    }
    next();
}



module.exports = requireAuth;