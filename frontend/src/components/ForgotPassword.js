import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useNotification } from './NotificationContext';
import './Form.css';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showNotification } = useNotification();
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate API call
        setTimeout(() => {
            showNotification('If an account with that email exists, a password reset link has been sent.', 'info');
            navigate('/');
        }, 1500);
    };

    return (
        <div className="auth-page-wrapper">
            <div className="form-container">
                <h2>Forgot Password</h2>
                <p className="form-description">Enter your email address and we will send you a link to reset your password.</p>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>
                <div className="form-links center" style={{ marginTop: '24px' }}>
                    <Link to="/">← Back to Login</Link>
                </div>
            </div>
        </div>
    );
}

export default ForgotPassword;