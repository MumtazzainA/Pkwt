# PKWT Notification System - Setup Instructions

## 1. Install Nodemailer (Already Completed ✅)
```bash
npm install nodemailer
```

## 2. Create Notifications Database Table

### Option A: Using pgAdmin (Recommended)
1. Open pgAdmin
2. Connect to your PostgreSQL server
3. Select the `postgres` database
4. Open Query Tool (Tools > Query Tool)
5. Copy and paste the contents of `server/notification_schema.sql`
6. Click Execute (F5)

### Option B: Using psql Command Line
```bash
# Navigate to project directory
cd c:\Users\LENOVO\Downloads\pkwt_management

# Run the schema file
psql -U postgres -d postgres -f server/notification_schema.sql
```

## 3. Configure Email Settings (Optional but Recommended)

Edit the `.env` file and uncomment/configure the email settings:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Getting Gmail App Password:
1. Go to your Google Account settings
2. Navigate to Security > 2-Step Verification
3. Scroll to "App passwords"
4. Generate a new app password for "Mail"
5. Copy the 16-character password
6. Use it as `SMTP_PASS` in your `.env` file

**Note**: If you don't configure email, the system will still work but will only show in-app notifications without sending emails.

## 4. Restart the Server

After creating the database table, restart your backend server:

1. Stop the current server (if running)
2. Run: `npm run server`

You should see:
```
✅ Server running on port 5000
🔔 Starting notification checker service...
🚀 [Notification Checker] Service started
```

## 5. Verify Installation

### Test the Notification API:
```bash
# Get all notifications
curl http://localhost:5000/api/notifications

# Get notification count
curl http://localhost:5000/api/notifications/count
```

### Check Frontend:
1. Open the application in your browser
2. Look for the bell icon (🔔) in the sidebar
3. The icon should be visible at the top of the sidebar

## 6. Testing Notifications

### Create a Test Contract:
To test the notification system, you need a contract that will expire in exactly 30, 7, or 1 days:

1. Go to "Input Data" or "Data PKWT"
2. Add a new contract with:
   - End Date = Today + 30 days (for 30-day notification)
   - Status = Active
3. Wait for the notification checker to run (runs every hour)
4. Or restart the server to trigger an immediate check

### Force Immediate Check (For Testing):
Edit `server/services/notificationChecker.js` line 125 and uncomment:
```javascript
// For testing: run every minute instead of every hour
const intervalId = setInterval(checkContractsAndNotify, 60000);
```

## Troubleshooting

### Issue: No notifications appearing
- Check that the notifications table was created successfully
- Verify the server logs for any errors
- Ensure you have contracts with exactly 30, 7, or 1 days remaining

### Issue: Email not sending
- Verify SMTP credentials in `.env` file
- Check server logs for email errors
- Ensure Gmail "Less secure app access" is enabled or use App Password

### Issue: Bell icon not showing
- Clear browser cache
- Check browser console for errors
- Verify `NotificationBell.jsx` is imported in `Sidebar.jsx`

## System Features

✅ **In-App Notifications**: Real-time notification bell with badge count
✅ **Email Notifications**: Automated emails to all registered users
✅ **Multiple Thresholds**: Alerts at 30, 7, and 1 day before expiry
✅ **Auto-Refresh**: Notifications refresh every 60 seconds
✅ **Mark as Read**: Individual and bulk mark as read functionality
✅ **Persistent**: Notifications stored in database
✅ **No Duplicates**: System prevents duplicate notifications

## Next Steps

1. Create the database table using one of the methods above
2. (Optional) Configure email settings
3. Restart the server
4. Test by creating a contract with appropriate end date
5. Monitor the bell icon for notifications

---

For any issues, check the server console logs for detailed error messages.
