import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('unread'); // 'all' or 'unread'

    useEffect(() => {
        fetchNotifications();
    }, [filter]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const endpoint = filter === 'all'
                ? 'http://localhost:5000/api/notifications/all'
                : 'http://localhost:5000/api/notifications';

            const response = await fetch(endpoint);
            if (response.ok) {
                const data = await response.json();
                setNotifications(data);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            const response = await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
                method: 'PUT',
            });

            if (response.ok) {
                fetchNotifications();
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/notifications/mark-all-read', {
                method: 'PUT',
            });

            if (response.ok) {
                fetchNotifications();
            }
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const deleteNotification = async (id) => {
        if (window.confirm('Hapus notifikasi ini?')) {
            try {
                const response = await fetch(`http://localhost:5000/api/notifications/${id}`, {
                    method: 'DELETE',
                });

                if (response.ok) {
                    fetchNotifications();
                }
            } catch (error) {
                console.error('Error deleting notification:', error);
            }
        }
    };

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

    const getNotificationStyle = (type) => {
        switch (type) {
            case 'critical_1day':
                return {
                    icon: '🚨',
                    color: '#dc2626',
                    bg: '#fee2e2',
                    label: 'Kritis',
                    priority: 'high'
                };
            case 'warning_7days':
                return {
                    icon: '⚠️',
                    color: '#f59e0b',
                    bg: '#fef3c7',
                    label: 'Peringatan',
                    priority: 'medium'
                };
            case 'warning_30days':
                return {
                    icon: '🔔',
                    color: '#3b82f6',
                    bg: '#dbeafe',
                    label: 'Informasi',
                    priority: 'low'
                };
            default:
                return {
                    icon: '📢',
                    color: '#6b7280',
                    bg: '#f3f4f6',
                    label: 'Notifikasi',
                    priority: 'low'
                };
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="main-content">
                <div className="header-glass">
                    <h1>📬 Notifikasi</h1>
                    <p style={{ color: '#666', marginTop: '0.5rem' }}>
                        Kelola semua notifikasi PKWT Anda
                    </p>
                </div>

                <div className="notifications-page-container glass-card">
                    {/* Header Actions */}
                    <div className="notifications-header-actions">
                        <div className="filter-tabs">
                            <button
                                className={`filter-tab ${filter === 'unread' ? 'active' : ''}`}
                                onClick={() => setFilter('unread')}
                            >
                                Belum Dibaca
                                {filter === 'unread' && notifications.length > 0 && (
                                    <span className="tab-badge">{notifications.length}</span>
                                )}
                            </button>
                            <button
                                className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                                onClick={() => setFilter('all')}
                            >
                                Semua
                            </button>
                        </div>

                        {notifications.length > 0 && filter === 'unread' && (
                            <button
                                className="btn-mark-all-read"
                                onClick={markAllAsRead}
                            >
                                ✓ Tandai Semua Dibaca
                            </button>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div className="notifications-page-list">
                        {loading ? (
                            <div className="loading-state">
                                <div className="spinner"></div>
                                <p>Memuat notifikasi...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="empty-state">
                                <span className="empty-icon">✨</span>
                                <h3>Tidak Ada Notifikasi</h3>
                                <p>
                                    {filter === 'unread'
                                        ? 'Semua notifikasi sudah dibaca!'
                                        : 'Belum ada notifikasi untuk ditampilkan.'}
                                </p>
                            </div>
                        ) : (
                            notifications.map((notification) => {
                                const style = getNotificationStyle(notification.type);
                                const remainingDays = calculateRemainingDays(notification.end_date);

                                return (
                                    <div
                                        key={notification.id}
                                        className={`notification-card ${!notification.is_read ? 'unread' : ''}`}
                                        style={{ borderLeftColor: style.color }}
                                    >
                                        <div className="notification-card-icon" style={{ background: style.bg }}>
                                            {style.icon}
                                        </div>

                                        <div className="notification-card-content">
                                            <div className="notification-card-header">
                                                <span
                                                    className="priority-badge"
                                                    style={{
                                                        background: style.bg,
                                                        color: style.color
                                                    }}
                                                >
                                                    {style.label}
                                                </span>
                                                <span className="notification-date">
                                                    {formatDate(notification.created_at)}
                                                </span>
                                            </div>

                                            <p className="notification-card-message">
                                                {notification.message}
                                            </p>

                                            <div className="notification-card-details">
                                                <div className="detail-item">
                                                    <strong>Tanggal Berakhir:</strong>{' '}
                                                    {new Date(notification.end_date).toLocaleDateString('id-ID')}
                                                </div>
                                                <div className="detail-item">
                                                    <strong>Sisa Waktu:</strong>{' '}
                                                    <span
                                                        style={{
                                                            color: style.color,
                                                            fontWeight: 'bold'
                                                        }}
                                                    >
                                                        {remainingDays} hari
                                                    </span>
                                                </div>
                                                {notification.sent_email && (
                                                    <div className="detail-item">
                                                        <span className="email-sent-badge">
                                                            ✉️ Email terkirim
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="notification-card-actions">
                                            {!notification.is_read && (
                                                <button
                                                    className="btn-action btn-read"
                                                    onClick={() => markAsRead(notification.id)}
                                                    title="Tandai sudah dibaca"
                                                >
                                                    ✓
                                                </button>
                                            )}
                                            <button
                                                className="btn-action btn-delete"
                                                onClick={() => deleteNotification(notification.id)}
                                                title="Hapus notifikasi"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Notifications;
