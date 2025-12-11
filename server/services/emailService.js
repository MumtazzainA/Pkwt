import nodemailer from 'nodemailer';
import 'dotenv/config';

// Create reusable transporter
let transporter = null;

function getTransporter() {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }
    return transporter;
}

/**
 * Send notification email to all registered users
 * @param {Array} recipients - Array of email addresses
 * @param {Object} contractData - PKWT contract data
 * @param {number} remainingDays - Days remaining until contract expiry
 */
export async function sendNotificationEmail(recipients, contractData, remainingDays) {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('⚠️ Email configuration not set. Skipping email notification.');
        return { success: false, error: 'Email not configured' };
    }

    if (!recipients || recipients.length === 0) {
        console.warn('⚠️ No recipients found. Skipping email notification.');
        return { success: false, error: 'No recipients' };
    }

    try {
        const transport = getTransporter();

        // Determine urgency level
        let urgencyClass = 'info';
        let urgencyText = 'Pemberitahuan';
        if (remainingDays <= 1) {
            urgencyClass = 'critical';
            urgencyText = 'URGENT';
        } else if (remainingDays <= 7) {
            urgencyClass = 'warning';
            urgencyText = 'Peringatan';
        }

        // Create HTML email template
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-weight: bold; margin-bottom: 15px; }
        .badge.info { background: #3b82f6; color: white; }
        .badge.warning { background: #f59e0b; color: white; }
        .badge.critical { background: #dc2626; color: white; }
        .contract-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
        .detail-row { margin: 10px 0; }
        .detail-label { font-weight: bold; color: #667eea; }
        .remaining-days { font-size: 32px; font-weight: bold; color: #dc2626; text-align: center; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>🔔 Notifikasi PKWT</h2>
        </div>
        <div class="content">
            <div class="badge ${urgencyClass}">${urgencyText}</div>
            
            <p>Kontrak PKWT berikut akan segera berakhir:</p>
            
            <div class="contract-details">
                <div class="detail-row">
                    <span class="detail-label">Nama Karyawan:</span> ${contractData.name}
                </div>
                <div class="detail-row">
                    <span class="detail-label">Posisi:</span> ${contractData.position}
                </div>
                <div class="detail-row">
                    <span class="detail-label">Lokasi Kerja:</span> ${contractData.work_location || '-'}
                </div>
                <div class="detail-row">
                    <span class="detail-label">No. Kontrak:</span> ${contractData.contract_number || '-'}
                </div>
                <div class="detail-row">
                    <span class="detail-label">Tanggal Berakhir:</span> ${new Date(contractData.end_date).toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })}
                </div>
            </div>
            
            <div class="remaining-days">
                ${remainingDays} Hari Tersisa
            </div>
            
            <p style="text-align: center; color: #666;">
                ${remainingDays <= 1 ? '⚠️ Kontrak akan berakhir dalam waktu kurang dari 24 jam!' :
                remainingDays <= 7 ? '⚠️ Segera lakukan tindakan yang diperlukan!' :
                    'Mohon perhatikan dan rencanakan tindakan yang diperlukan.'}
            </p>
            
            <div class="footer">
                <p>Email ini dikirim secara otomatis oleh Sistem Manajemen PKWT</p>
                <p>Silakan login ke sistem untuk informasi lebih lengkap</p>
            </div>
        </div>
    </div>
</body>
</html>
        `;

        // Send email to all recipients
        const results = [];
        for (const recipient of recipients) {
            try {
                const info = await transport.sendMail({
                    from: `"PKWT Management System" <${process.env.SMTP_USER}>`,
                    to: recipient,
                    subject: `⚠️ Notifikasi PKWT - ${contractData.name} (${remainingDays} hari tersisa)`,
                    html: htmlContent,
                });

                console.log(`✅ Email sent to ${recipient}: ${info.messageId}`);
                results.push({ email: recipient, success: true, messageId: info.messageId });
            } catch (error) {
                console.error(`❌ Failed to send email to ${recipient}:`, error.message);
                results.push({ email: recipient, success: false, error: error.message });
            }
        }

        return {
            success: true,
            results,
            totalSent: results.filter(r => r.success).length,
            totalFailed: results.filter(r => !r.success).length
        };

    } catch (error) {
        console.error('❌ Error in sendNotificationEmail:', error);
        return { success: false, error: error.message };
    }
}

export default { sendNotificationEmail };
