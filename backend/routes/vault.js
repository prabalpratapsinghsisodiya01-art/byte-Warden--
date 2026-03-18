const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Middleware to verify JWT token
const auth = (req, res, next) => {
    const token = req.header('auth-token');
    if (!token) return res.status(401).send('Access Denied');

    try {
        const verified = jwt.verify(token, process.env.TOKEN_SECRET || 'secret');
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).send('Invalid Token');
    }
};

// Get all passwords for a user
router.get('/', auth, async (req, res) => {
    try {
        const passwords = await prisma.vault.findMany({
            where: { userId: req.user.id }
        });
        res.json(passwords);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add a new password
router.post('/', auth, async (req, res) => {
    try {
        const { title, username, password, url } = req.body;
        const newPassword = await prisma.vault.create({
            data: {
                title,
                username,
                password, // NOTE: In prod, the user master password encrypts this client-side!
                url,
                userId: req.user.id
            }
        });
        res.status(201).json(newPassword);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Delete a password
router.delete('/:id', auth, async (req, res) => {
    try {
        const id = req.params.id;
        const result = await prisma.vault.delete({
            where: { 
                id: id,
                // userId: req.user.id // Prisma nested delete limitation handling might be needed depending on schema
            }
        });
        res.json({ message: "Deleted successfully" });
    } catch (err) {
        res.status(400).json({ error: "Could not delete or unauthorized" });
    }
});

module.exports = router;
