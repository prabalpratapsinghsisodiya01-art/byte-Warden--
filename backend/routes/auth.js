const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Register
router.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user already exists
        const emailExist = await prisma.user.findUnique({ where: { email } });
        if (emailExist) return res.status(400).send('Email already exists');

        // Hash passwords
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create a new user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword
            }
        });

        res.status(201).json({ user: user.id });
    } catch (err) {
        res.status(400).send(err.message);
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Checking if the email exists
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(400).send('Email is not found');

        // Password is correct
        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) return res.status(400).send('Invalid password');

        // Create and assign a token
        const token = jwt.sign({ id: user.id }, process.env.TOKEN_SECRET || 'secret');
        res.header('auth-token', token).send(token);
    } catch (err) {
        res.status(400).send(err.message);
    }
});

module.exports = router;
