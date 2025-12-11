import 'dotenv/config';
import pg from 'pg';
import readline from 'readline';

const { Pool } = pg;

async function setupNotificationsTable() {
    let pool;

    try {
        // Create pool connection
        pool = new Pool({
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT,
        });

        console.log('🔗 Connecting to database...');

        // Create notifications table
        const createTableQuery = `
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    pkwt_id INTEGER REFERENCES pkwt(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    sent_email BOOLEAN DEFAULT FALSE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
        `;

        console.log('📝 Creating notifications table...');
        await pool.query(createTableQuery);
        console.log('✅ Table "notifications" created successfully!');

        // Create indexes
        console.log('📝 Creating indexes...');

        await pool.query('CREATE INDEX IF NOT EXISTS idx_notifications_pkwt_id ON notifications(pkwt_id)');
        console.log('✅ Index "idx_notifications_pkwt_id" created');

        await pool.query('CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read)');
        console.log('✅ Index "idx_notifications_is_read" created');

        await pool.query('CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC)');
        console.log('✅ Index "idx_notifications_created_at" created');

        console.log('\n🎉 Notifications table setup complete!');
        console.log('📌 You can now restart your server to start receiving notifications.');

    } catch (error) {
        console.error('❌ Error setting up notifications table:', error.message);
        process.exit(1);
    } finally {
        if (pool) {
            await pool.end();
        }
    }
}

// Check if password is in environment
if (process.env.DB_PASSWORD) {
    console.log('🔑 Using database password from environment variable\n');
    setupNotificationsTable();
} else {
    // Prompt for password
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log('🔐 Database password not found in .env file');
    rl.question('Please enter database password: ', (password) => {
        process.env.DB_PASSWORD = password.trim();
        rl.close();
        console.log('✅ Password set successfully\n');
        setupNotificationsTable();
    });
}
