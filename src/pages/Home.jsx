import React from 'react';
import Sidebar from '../components/Sidebar';

const Home = () => {
    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="main-content">
                <div className="header-glass">
                    <h1>Dashboard</h1>
                </div>

                <div className="content-area">
                    <div className="welcome-banner glass-card">
                        <h2>Welcome, Admin!</h2>
                        <p>Manage your PKWT data efficiently.</p>
                    </div>

                    <div className="action-grid">
                        <div className="action-card glass-card">
                            <h3>Input Data PKWT</h3>
                            <p>Add new employee contract data to the system.</p>
                            <button className="btn-primary action-btn" onClick={() => window.location.href = '/pkwt-data'}>
                                + Input Data
                            </button>
                        </div>

                        {/* Additional placeholders for future features */}
                        <div className="action-card glass-card">
                            <h3>View Reports</h3>
                            <p>Check monthly contract recapitulation.</p>
                            <button className="btn-secondary action-btn">
                                View Reports
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Home;
