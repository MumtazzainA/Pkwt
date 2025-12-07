import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import svgCaptcha from 'svg-captcha';
import { v4 as uuidv4 } from 'uuid';
import pool from '../db.js';

const router = express.Router();

// Store captcha sessions in memory (use Redis for production)
const captchaSessions = new Map();

// Generate CAPTCHA
router.get('/captcha', (req, res) => {
    const captcha = svgCaptcha.create({
        size: 5,
        noise: 3,
        color: true,
        background: '#f0f0f0'
    });

    const sessionId = uuidv4();
    captchaSessions.set(sessionId, {
        text: captcha.text.toLowerCase(),
        expires: Date.now() + 10 * 60 * 1000 // 10 minutes expiration
    });

    // Cleanup expired sessions occasionally
    if (captchaSessions.size > 1000) {
        for (const [key, value] of captchaSessions.entries()) {
            if (value.expires < Date.now()) {
                captchaSessions.delete(key);
            }
        }
    }

    res.json({
        sessionId,
        image: captcha.data
    });
});

// Register User
router.post('/register', async (req, res) => {
    const { name, email, password, captcha, captchaSessionId } = req.body;

    // Validate CAPTCHA
    const session = captchaSessions.get(captchaSessionId);
    if (!session || session.text !== captcha.toLowerCase()) {
        return res.status(400).json({ message: 'Invalid or expired CAPTCHA' });
    }

    // Invalidate used captcha
    captchaSessions.delete(captchaSessionId);

    try {
        console.log('[REGISTER] Attempting to register user:', email);

        // Check if user exists
        const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            console.log('[REGISTER] User already exists:', email);
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert user
        console.log('[REGISTER] Inserting new user into database...');
        const newUser = await pool.query(
            'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
            [name, email, hashedPassword]
        );

        console.log('[REGISTER] ✅ User registered successfully:', newUser.rows[0]);
        res.status(201).json({ message: 'User registered successfully', user: newUser.rows[0] });

    } catch (err) {
        console.error('[REGISTER] Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Login User
router.post('/login', async (req, res) => {
    const { email, password, captcha, captchaSessionId } = req.body;

    // Validate CAPTCHA
    const session = captchaSessions.get(captchaSessionId);
    if (!session || session.text !== captcha.toLowerCase()) {
        return res.status(400).json({ message: 'Invalid or expired CAPTCHA' });
    }

    // Invalidate used captcha (optional, consider UX if user fails password)
    captchaSessions.delete(captchaSessionId);

    try {
        // Check user
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const user = userResult.rows[0];

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create JWT Token
        const token = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET || 'secret_jwt_key',
            { expiresIn: '1h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
