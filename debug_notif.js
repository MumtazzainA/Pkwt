import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

function calculateRemainingDays(endDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

async function debug() {
    try {
        console.log('--- DEBUG START ---');
        console.log('Today:', new Date().toLocaleString());

        const resContracts = await pool.query("SELECT id, name, end_date FROM pkwt WHERE status = 'Active'");
        console.log(`Found ${resContracts.rows.length} active contracts.`);

        for (const contract of resContracts.rows) {
            const days = calculateRemainingDays(contract.end_date);
            console.log(`Contract: ${contract.name} (ID: ${contract.id}), End: ${new Date(contract.end_date).toDateString()}, Remaining: ${days} days`);

            const resNotif = await pool.query("SELECT * FROM notifications WHERE pkwt_id = $1", [contract.id]);
            if (resNotif.rows.length > 0) {
                console.log(`  -> Notifications found: ${resNotif.rows.map(n => n.type).join(', ')}`);
            } else {
                console.log(`  -> No notifications`);
            }
        }

        console.log('--- DEBUG END ---');
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

debug();
