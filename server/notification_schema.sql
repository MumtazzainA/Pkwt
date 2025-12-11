-- Run this SQL script to create the notifications table
-- You can run it using pgAdmin or psql command line

-- Create Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    pkwt_id INTEGER REFERENCES pkwt(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    sent_email BOOLEAN DEFAULT FALSE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_pkwt_id ON notifications(pkwt_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Verify table was created
SELECT table_name FROM information_schema.tables WHERE table_name = 'notifications';

COMMENT ON TABLE notifications IS 'Stores PKWT contract expiry notifications';
COMMENT ON COLUMN notifications.type IS 'Type: warning_30days, warning_7days, or critical_1day';
COMMENT ON COLUMN notifications.sent_email IS 'Whether email notification was sent';
COMMENT ON COLUMN notifications.is_read IS 'Whether user has read the notification';
