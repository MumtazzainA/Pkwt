import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import readline from 'readline';
import pool from './db.js';
import authRoutes from './routes/auth.js';
import pkwtRoutes from './routes/pkwt.js';

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Log all requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/pkwt', pkwtRoutes);

// Test routes
app.get('/', (req, res) => {
    res.send('PKWT Management API is running');
});

app.get('/api/test', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ message: 'Database connected', time: result.rows[0].now });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

// Function to start server
function startServer() {
    const server = app.listen(port, () => {
        console.log(`✅ Server running on port ${port}`);
        console.log(`📡 API: http://localhost:${port}`);
        console.log(`💾 Database: ${process.env.DB_NAME}`);
        console.log(`\n🟢 Server is ready to accept requests\n`);
    });

    // Keep server running
    server.on('error', (err) => {
        console.error('Server error:', err);
    });

    process.on('SIGTERM', () => {
        console.log('SIGTERM received, closing server...');
        server.close(() => {
            console.log('Server closed');
            process.exit(0);
        });
    });

    process.on('SIGINT', () => {
        console.log('SIGINT received, closing server...');
        server.close(() => {
            console.log('Server closed');
            process.exit(0);
        });
    });

    // Keep server alive on errors
    process.on('uncaughtException', (err) => {
        console.error('❌ Uncaught Exception:', err);
        console.log('Server continues running...');
    });

    process.on('unhandledRejection', (reason, promise) => {
        console.error('❌ Unhandled Rejection:', reason);
        console.log('Server continues running...');
    });

    return server;
}

// Check if DB_PASSWORD is provided via environment
if (process.env.DB_PASSWORD) {
    console.log('🔑 Using database password from environment variable');
    startServer();
} else {
    // Prompt for password
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log('🔐 Database password not found in .env file');
    rl.question('Please enter database password: ', (password) => {
        process.env.DB_PASSWORD = password;
        rl.close();
        console.log('✅ Password set successfully\n');
        startServer();
    });
}
