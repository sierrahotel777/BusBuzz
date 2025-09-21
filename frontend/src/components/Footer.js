import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
    const currentYear = new Date().getFullYear();
    return (
        <footer className="app-footer">
            <div className="footer-content">
                <p>&copy; {currentYear} BusBuzz. All Rights Reserved.</p>
                <div className="footer-links">
                    <Link to="/help">Help & Support</Link>
                    <span>|</span>
                    <Link to="/privacy">Privacy Policy</Link>
                    <span>|</span>
                    <Link to="/terms">Terms of Service</Link>
                    <span>|</span>
                    <Link to="/status">System Status</Link>
                </div>
            </div>
        </footer>
    );
};

export default Footer;