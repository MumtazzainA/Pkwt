import React, { useState, useEffect } from 'react';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);

    // Fetch notifications
    const fetchNotifications = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/notifications');
            if (response.ok) {
                const data = await response.json();
                setNotifications(data);
                setUnreadCount(data.length);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    // Mark notification as read
    const markAsRead = async (id) => {
        try {
            const response = await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
                method: 'PUT',
            });

            if (response.ok) {
                // Update local state
                setNotifications(notifications.filter(n => n.id !== id));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/notifications/mark-all-read', {
                method: 'PUT',
            });

            if (response.ok) {
                setNotifications([]);
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    // Calculate remaining days
    const calculateRemainingDays = (endDate) => {
        // Get today's date at midnight (local time, no timezone conversion)
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Parse end date string (YYYY-MM-DD format from database)
        const dateStr = endDate.split('T')[0]; // Get just the date part
        const [year, month, day] = dateStr.split('-').map(num => parseInt(num));
        const end = new Date(year, month - 1, day); // month is 0-indexed

        // Calculate difference in milliseconds and convert to days
        const diffMs = end - today;
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

        // Add 1 to fix timezone offset issue (WIB UTC+7)
        return diffDays + 1;
    };

    // Get notification icon and color based on type
    const getNotificationStyle = (type) => {
        switch (type) {
            case 'critical_1day':
                return { icon: '🚨', color: '#dc2626', bg: '#fee2e2' };
            case 'warning_7days':
                return { icon: '⚠️', color: '#f59e0b', bg: '#fef3c7' };
            case 'warning_30days':
                return { icon: '🔔', color: '#3b82f6', bg: '#dbeafe' };
            default:
                return { icon: '📢', color: '#6b7280', bg: '#f3f4f6' };
        }
    };

    // Format time ago
    const timeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);

        if (seconds < 60) return 'Baru saja';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} menit lalu`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam lalu`;
        return `${Math.floor(seconds / 86400)} hari lalu`;
    };

    // Initial fetch and auto-refresh every 60 seconds
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showDropdown && !event.target.closest('.notification-bell-container')) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showDropdown]);

    return (
        <div className="notification-bell-container">
            <button
                className="notification-bell-button"
                onClick={() => setShowDropdown(!showDropdown)}
                aria-label="Notifications"
            >
                <span className="bell-icon">🔔</span>
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
            </button>

            {showDropdown && (
                <div className="notification-dropdown">
                    <div className="notification-header">
                        <h3>Notifikasi</h3>
                        {unreadCount > 0 && (
                            <button
                                className="mark-all-read-btn"
                                onClick={markAllAsRead}
                            >
                                Tandai semua dibaca
                            </button>
                        )}
                    </div>

                    <div className="notification-list">
                        {loading ? (
                            <div className="notification-loading">Memuat...</div>
                        ) : notifications.length === 0 ? (
                            <div className="notification-empty">
                                <span className="empty-icon">✨</span>
                                <p>Tidak ada notifikasi baru</p>
                            </div>
                        ) : (
                            notifications.map((notification) => {
                                const style = getNotificationStyle(notification.type);
                                const remainingDays = calculateRemainingDays(notification.end_date);

                                return (
                                    <div
                                        key={notification.id}
                                        className="notification-item"
                                        style={{ borderLeftColor: style.color }}
                                    >
                                        <div className="notification-icon" style={{ background: style.bg }}>
                                            {style.icon}
                                        </div>

                                        <div className="notification-content">
                                            <div className="notification-message">
                                                {notification.message}
                                            </div>

                                            <div className="notification-details">
                                                <span className="notification-time">{timeAgo(notification.created_at)}</span>
                                                <span className="notification-separator">•</span>
                                                <span
                                                    className="notification-days"
                                                    style={{ color: style.color, fontWeight: 'bold' }}
                                                >
                                                    {remainingDays} hari tersisa
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            className="notification-close"
                                            onClick={() => markAsRead(notification.id)}
                                            aria-label="Mark as read"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="notification-footer">
                            <a href="/notifications">
                                Lihat semua notifikasi
                            </a>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
