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

            // Determine notification type based on range
            let notifType = null;
            let message = null;

            if (remainingDays <= 1) {
                // Critical: 1 day or less (including overdue, though usually handled elsewhere)
                notifType = 'critical_1day';
                message = `🚨 URGENT: Kontrak PKWT untuk ${contract.name} (${contract.position}) akan berakhir besok!`;
            } else if (remainingDays <= 7) {
                // Warning: 7 days or less
                notifType = 'warning_7days';
                message = `⚠️ Kontrak PKWT untuk ${contract.name} (${contract.position}) akan berakhir dalam 7 hari!`;
            } else if (remainingDays <= 30) {
                // Info: 30 days or less
                notifType = 'warning_30days';
                message = `Kontrak PKWT untuk ${contract.name} (${contract.position}) akan berakhir dalam 30 hari.`;
            }

            if (!notifType) continue;

            // Check if THIS specific notification type already exists
            // We want to ensure we don't send the SAME level notification twice
            const exists = await notificationExists(pool, contract.id, notifType);

            if (exists) {
                // Console log verbose just for debugging, maybe comment out production
                // console.log(`ℹ️ [Notification Checker] Notification ${notifType} already exists for ${contract.name}`);
                continue;
            }

            console.log(`⚠️ [Notification Checker] Creating ${notifType} for "${contract.name}" (${remainingDays} days remaining)`);

            // Send email notification
            let emailSent = false;
            // Only send email if we haven't sent this specific type before (implicit by notificationExists check above)
            if (userEmails.length > 0) {
                const emailResult = await sendNotificationEmail(userEmails, contract, remainingDays);
                if (emailResult.success) {
                    emailSent = true;
                    emailsSent += emailResult.totalSent || 0;
                    console.log(`📧 [Notification Checker] Email sent to ${emailResult.totalSent} users`);
                }
            }

            // Create notification in database
            await createNotification(pool, contract.id, notifType, message, emailSent);
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
