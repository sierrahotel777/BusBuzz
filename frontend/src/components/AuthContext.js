import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser, getAllUsers } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};

export const AuthProvider = ({ children }) => {
    const [users, setUsers] = useState([]);
    const [user, setUser] = useState(() => {
        try {
            const savedUser = localStorage.getItem('busbuzz-user');
            return savedUser ? JSON.parse(savedUser) : null;
        } catch (error) {
            console.error("Could not parse user from localStorage", error);
            return null;
        }
    });
    const [isLoading, setIsLoading] = useState(true); // Start with loading true
    const [isExiting, setIsExiting] = useState(false);
    const navigate = useNavigate();

    const fetchUsers = async () => {
        try {
            const allUsers = await getAllUsers();
            setUsers(allUsers);
        } catch (error) {
            console.error("Failed to fetch users on load", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        try {
            if (user) {
                localStorage.setItem('busbuzz-user', JSON.stringify(user));
            } else {
                localStorage.removeItem('busbuzz-user');
            }
        } catch (error) {
            console.error("Could not update user in localStorage", error);
        }
    }, [user]); // Re-run when user object changes

    const login = async (email, password) => {
        try {
            const data = await loginUser(email, password);
            const loggedInUser = data.user;
            setUser({ ...loggedInUser, lastActive: new Date().toISOString() });
            return loggedInUser;
        } catch (error) {
            console.error("Login failed:", error);
            throw error;
        }
    };

    const logout = () => {
        setIsExiting(true); 
        setTimeout(() => {
            setUser(null); 
            navigate('/login'); 
            setIsExiting(false); 
        }, 500); // Match animation duration
    };

    const register = (userData) => {
        return registerUser(userData).then(data => {
            // Optionally fetch users again or just add to the local state
            // For now, we can just rely on a page refresh or next login to get the full list
            return data;
        });
    };

    const updateUser = (updatedUserData) => {
        setUsers(currentUsers => currentUsers.map(u => u.id === updatedUserData.id ? { ...u, ...updatedUserData } : u));
        if (user && user.id === updatedUserData.id) {
            setUser(currentUser => ({ ...currentUser, ...updatedUserData }));
        }
    };

    const deleteUser = (userId) => {
        setUsers(currentUsers => currentUsers.filter(u => u.id !== userId));
    };

    const awardPoints = (pointsToAward) => {
        if (user) {
            const updatedUser = { ...user, points: (user.points || 0) + pointsToAward };
            setUser(updatedUser);
        }
    };


    const value = { user, users, login, logout, register, isLoading, isExiting, updateUser, deleteUser, awardPoints, refetchUsers: fetchUsers };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
