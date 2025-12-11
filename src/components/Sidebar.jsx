import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = () => {
    return (
        <aside className="sidebar glass-card">
            <div className="profile-section">
                <div className="avatar-container">
                    {/* Placeholder for Avatar */}
                    <div className="avatar">
                        <span className="avatar-placeholder">U</span>
                    </div>
                </div>
                <h3 className="user-name">Admin User</h3>
                <p className="user-role">Administrator</p>

                <button className="btn-secondary edit-profile-btn">
                    Edit Profile
                </button>
            </div>

            <nav className="sidebar-nav">
                <ul>
                    <li><Link to="/home" className="nav-item active">Dashboard</Link></li>
                    <li><Link to="/pkwt-data" className="nav-item">Data PKWT</Link></li>
                    <li><Link to="/notifications" className="nav-item">Notifikasi</Link></li>
                    <li><Link to="/settings" className="nav-item">Settings</Link></li>
                </ul>
            </nav>

            <div className="sidebar-footer">
                <button
                    onClick={() => {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        window.location.href = '/login';
                    }}
                    className="logout-link"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}
                >
                    Logout
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
