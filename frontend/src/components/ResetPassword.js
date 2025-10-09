import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from './NotificationContext';
import './Form.css';
import PasswordInput from './PasswordInput';

function ResetPassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showNotification } = useNotification();
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();

        if (password.length < 6) {
            showNotification("Password must be at least 6 characters long.", "error");
            return;
        }

        if (password !== confirmPassword) {
            showNotification("Passwords do not match.", "error");
            return;
        }
        
        setIsSubmitting(true);

        // Simulate API call
        setTimeout(() => {
            showNotification('Password has been reset successfully! Please log in.');
            navigate('/');
        }, 1500);
    };

    return (
        <div className="form-container">
            <h2>Reset Your Password</h2>
            <p className="form-description">Enter your new password below.</p>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="password">New Password</label>
                    <PasswordInput
                        id="password"
                        placeholder="Enter new password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <PasswordInput
                        id="confirmPassword"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Reset Password'}
                </button>
            </form>
        </div>
    );
}

export default ResetPassword;