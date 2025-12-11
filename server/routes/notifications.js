import express from 'express';

const router = express.Router();

// Lazy load pool to ensure password is set first
async function getPool() {
    return (await import('../db.js')).default;
}

/**
 * GET /api/notifications
 * Get all unread notifications with contract details
 */
router.get('/', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.query(`
            SELECT 
                n.id,
                n.pkwt_id,
                n.type,
                n.message,
                n.sent_email,
                n.is_read,
                n.created_at,
                p.name,
                p.position,
                p.end_date
            FROM notifications n
            LEFT JOIN pkwt p ON n.pkwt_id = p.id
            WHERE n.is_read = false
            ORDER BY n.created_at DESC
        `);

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/**
 * GET /api/notifications/all
 * Get all notifications (read and unread)
 */
router.get('/all', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.query(`
            SELECT 
                n.id,
                n.pkwt_id,
                n.type,
                n.message,
                n.sent_email,
                n.is_read,
                n.created_at,
                p.name,
                p.position,
                p.end_date
            FROM notifications n
            LEFT JOIN pkwt p ON n.pkwt_id = p.id
            ORDER BY n.created_at DESC
            LIMIT 50
        `);

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching all notifications:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/**
 * PUT /api/notifications/:id/read
 * Mark a notification as read
 */
router.put('/:id/read', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await getPool();

        const result = await pool.query(
            'UPDATE notifications SET is_read = true WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json({ message: 'Notification marked as read', notification: result.rows[0] });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/**
 * PUT /api/notifications/mark-all-read
 * Mark all notifications as read
 */
router.put('/mark-all-read', async (req, res) => {
    try {
        const pool = await getPool();

        const result = await pool.query(
            'UPDATE notifications SET is_read = true WHERE is_read = false RETURNING *'
        );

        res.json({
            message: 'All notifications marked as read',
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await getPool();

        const result = await pool.query(
            'DELETE FROM notifications WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/**
 * GET /api/notifications/count
 * Get unread notification count
 */
router.get('/count', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.query(
            'SELECT COUNT(*) as count FROM notifications WHERE is_read = false'
        );

        res.json({ count: parseInt(result.rows[0].count) });
    } catch (error) {
        console.error('Error getting notification count:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router;
