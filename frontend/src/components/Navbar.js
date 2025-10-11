import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';
import logo from '../assets/logo.svg';
import './Navbar.css';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isNavOpen, setIsNavOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();

    const handleLogout = async () => {
        await logout();
        navigate('/'); 
    };

    const toggleNav = () => {
        setIsNavOpen(!isNavOpen);
    };

    const closeNav = () => {
        setIsNavOpen(false);
    }

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <NavLink to={user.role === 'admin' ? '/admin' : '/student'} className="navbar-brand" onClick={closeNav}>
                    <img src={logo} alt="BusBuzz Logo" className="navbar-logo" />
                    BusBuzz
                </NavLink>
                <button className="navbar-toggler" onClick={toggleNav} aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className={`navbar-collapse ${isNavOpen ? 'open' : ''}`}>
                    <ul className="navbar-nav">
                        {user.role === 'student' && (
                            <>
                                <li className="nav-item">
                                    <NavLink to="/student" className="nav-link" onClick={closeNav}>Dashboard</NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/feedback" className="nav-link" onClick={closeNav}>Submit Feedback</NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/lost-and-found" className="nav-link" onClick={closeNav}>Lost & Found</NavLink>
                                </li>
                            </>
                        )}
                        {user.role === 'admin' && (
                            <>
                                <li className="nav-item">
                                    <NavLink to="/admin" className="nav-link" onClick={closeNav}>Dashboard</NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/admin/bus-details" className="nav-link" onClick={closeNav}>Buses</NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/admin/feedback" className="nav-link" onClick={closeNav}>Feedback</NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/admin/lost-and-found" className="nav-link" onClick={closeNav}>Lost & Found</NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/admin/user-management" className="nav-link" onClick={closeNav}>Users</NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/admin/analytics" className="nav-link" onClick={closeNav}>Analytics</NavLink>
                                </li>
                            </>
                        )}
                        <li className="nav-item">
                            <NavLink to="/profile" className="nav-link" onClick={closeNav}>Profile</NavLink>
                        </li>
                        <li className="nav-item">
                            <button onClick={toggleTheme} className="theme-toggle-button">
                                {theme === 'light' ? '🌙' : '☀️'}
                            </button>
                        </li>
                         <li className="nav-item nav-item-logout">
                            <button onClick={handleLogout} className="logout-button">Logout</button>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;