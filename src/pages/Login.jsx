import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        captcha: ''
    });
    const [captchaSvg, setCaptchaSvg] = useState('');
    const [captchaSessionId, setCaptchaSessionId] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchCaptcha();
    }, []);

    const fetchCaptcha = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/auth/captcha');
            const data = await response.json();
            setCaptchaSvg(data.image);
            setCaptchaSessionId(data.sessionId);
        } catch (err) {
            console.error('Error fetching captcha:', err);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    captcha: formData.captcha,
                    captchaSessionId
                })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || 'Login failed');
                // Refresh captcha on failure
                fetchCaptcha();
                setFormData(prev => ({ ...prev, captcha: '' }));
                return;
            }

            // Save token to localStorage (or context)
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            alert('Login successful!');
            navigate('/'); // Navigate to dashboard/home

        } catch (err) {
            setError('Something went wrong. Please try again.');
        }
    };

    return (
        <div className="auth-container">
            <div className="glass-card auth-card">
                <h2 className="text-center" style={{ marginBottom: '2rem', color: '#1a1a1a' }}>Login</h2>
                {error && <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email" className="form-label">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            className="form-input"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password" className="form-label">Password</label>
                        <input
                            type="password"
                            id="password"
                            className="form-input"
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* CAPTCHA Section */}
                    <div className="form-group">
                        <label htmlFor="captcha" className="form-label">Security Check</label>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                            <div dangerouslySetInnerHTML={{ __html: captchaSvg }} style={{ border: '1px solid #ddd', borderRadius: '4px', marginRight: '10px', backgroundColor: '#f0f0f0' }} />
                            <button
                                type="button"
                                onClick={fetchCaptcha}
                                style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                                Refresh
                            </button>
                        </div>
                        <input
                            type="text"
                            id="captcha"
                            className="form-input"
                            placeholder="Type the characters above"
                            value={formData.captcha}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button type="submit" className="btn-primary">Sign In</button>
                </form>
                <p className="text-center" style={{ marginTop: '1.5rem', fontSize: '0.9rem' }}>
                    Don't have an account? <Link to="/register">Create one</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
