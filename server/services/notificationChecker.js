import 'dotenv/config';
import { sendNotificationEmail } from './emailService.js';

// Lazy load pool to ensure password is set first
async function getPool() {
    return (await import('../db.js')).default;
}

/**
 * Calculate remaining days between today and end date
 */
function calculateRemainingDays(endDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

/**
 * Get notification type and message based on remaining days
 */
function getNotificationInfo(remainingDays, contractData) {
    let type, message;

    if (remainingDays === 30) {
        type = 'warning_30days';
        message = `Kontrak PKWT untuk ${contractData.name} (${contractData.position}) akan berakhir dalam 30 hari.`;
    } else if (remainingDays === 7) {
        type = 'warning_7days';
        message = `⚠️ Kontrak PKWT untuk ${contractData.name} (${contractData.position}) akan berakhir dalam 7 hari!`;
    } else if (remainingDays === 1) {
        type = 'critical_1day';
        message = `🚨 URGENT: Kontrak PKWT untuk ${contractData.name} (${contractData.position}) akan berakhir besok!`;
    } else {
        return null;
    }

    return { type, message };
}

/**
 * Check if notification already exists for this contract and type
 */
async function notificationExists(pool, pkwtId, type) {
    const result = await pool.query(
        'SELECT id FROM notifications WHERE pkwt_id = $1 AND type = $2',
        [pkwtId, type]
    );
    return result.rows.length > 0;
}

/**
 * Create notification in database
 */
async function createNotification(pool, pkwtId, type, message, emailSent) {
    const result = await pool.query(
        'INSERT INTO notifications (pkwt_id, type, message, sent_email) VALUES ($1, $2, $3, $4) RETURNING *',
        [pkwtId, type, message, emailSent]
    );
    return result.rows[0];
}

/**
 * Get all user emails
 */
async function getAllUserEmails(pool) {
    const result = await pool.query('SELECT email FROM users');
    return result.rows.map(row => row.email);
}

/**
 * Main function to check contracts and send notifications
 */
export async function checkContractsAndNotify() {
    try {
        const pool = await getPool();

        console.log('🔍 [Notification Checker] Starting contract check...');

        // Get all active PKWT contracts
        const result = await pool.query(
            "SELECT * FROM pkwt WHERE status = 'Active' ORDER BY end_date ASC"
        );

        const contracts = result.rows;
        console.log(`📋 [Notification Checker] Found ${contracts.length} active contracts`);

        if (contracts.length === 0) {
            console.log('✅ [Notification Checker] No active contracts found');
            return;
        }

        // Get all user emails once
        const userEmails = await getAllUserEmails(pool);
        console.log(`👥 [Notification Checker] Found ${userEmails.length} registered users`);

        let notificationsCreated = 0;
        let emailsSent = 0;

        // Check each contract
        for (const contract of contracts) {
            const remainingDays = calculateRemainingDays(contract.end_date);

            // Only process if remaining days is 30, 7, or 1
            if (remainingDays !== 30 && remainingDays !== 7 && remainingDays !== 1) {
                continue;
            }

            const notifInfo = getNotificationInfo(remainingDays, contract);
            if (!notifInfo) continue;

            // Check if notification already exists
            const exists = await notificationExists(pool, contract.id, notifInfo.type);
            if (exists) {
                console.log(`ℹ️ [Notification Checker] Notification already exists for contract ${contract.id} (${notifInfo.type})`);
                continue;
            }

            console.log(`⚠️ [Notification Checker] Contract "${contract.name}" has ${remainingDays} days remaining`);

            // Send email notification
            let emailSent = false;
            if (userEmails.length > 0) {
                const emailResult = await sendNotificationEmail(userEmails, contract, remainingDays);
                if (emailResult.success) {
                    emailSent = true;
                    emailsSent += emailResult.totalSent || 0;
                    console.log(`📧 [Notification Checker] Email sent to ${emailResult.totalSent} users`);
                }
            }

            // Create notification in database
            await createNotification(pool, contract.id, notifInfo.type, notifInfo.message, emailSent);
            notificationsCreated++;

            console.log(`✅ [Notification Checker] Notification created for contract ${contract.id}`);
        }

        console.log(`✅ [Notification Checker] Check complete: ${notificationsCreated} notifications created, ${emailsSent} emails sent`);

    } catch (error) {
        console.error('❌ [Notification Checker] Error:', error);
    }
}

/**
 * Start the notification checker service
 * Runs every hour
 */
export function startNotificationChecker() {
    console.log('🚀 [Notification Checker] Service started');

    // Run immediately on startup
    checkContractsAndNotify();

    // Then run every hour (3600000 ms)
    const intervalId = setInterval(checkContractsAndNotify, 3600000);

    // For testing: uncomment to run every minute
    // const intervalId = setInterval(checkContractsAndNotify, 60000);

    return intervalId;
}

export default { checkContractsAndNotify, startNotificationChecker };
