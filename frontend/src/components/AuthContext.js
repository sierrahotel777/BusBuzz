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
            // Handle this error, maybe show a notification
        } finally {
            // The user state is initialized synchronously from localStorage,
            // so we can set loading to false after fetching all users.
            setIsLoading(false);
        }
    };

    // This effect runs once on app load to signal that the initial user check is complete.
    useEffect(() => {
        fetchUsers();
    }, []);

    // Effect to update localStorage whenever the user object changes
    useEffect(() => {
        // This effect runs when the component mounts and whenever the `user` state changes.
        try {
            if (user) {
                // If user is logged in, save their data to localStorage.
                localStorage.setItem('busbuzz-user', JSON.stringify(user));
            } else {
                // If user is logged out, remove their data from localStorage.
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
            // The navigate logic is handled by the RootRedirect component upon state change.
            return loggedInUser;
        } catch (error) {
            console.error("Login failed:", error);
            // Re-throw the error to be caught by the calling component (e.g., Login.js)
            throw error;
        }
    };

    const logout = () => {
        setIsExiting(true); // Start the exit animation
        setTimeout(() => {
            setUser(null); // Clear the user state
            navigate('/login'); // Redirect to login page
            setIsExiting(false); // Reset animation state
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
        // also update the currently logged in user if they are the one being edited
        if (user && user.id === updatedUserData.id) {
            setUser(currentUser => ({ ...currentUser, ...updatedUserData }));
        }
        // In a real app, you'd also have an API call here to update the user in the DB
    };

    const deleteUser = (userId) => {
        setUsers(currentUsers => currentUsers.filter(u => u.id !== userId));
    };

    const awardPoints = (pointsToAward) => {
        if (user) {
            const updatedUser = { ...user, points: (user.points || 0) + pointsToAward };
            setUser(updatedUser);
            // In a real app, you'd also have an API call here to update the user's points in the DB
        }
    };


    const value = { user, users, login, logout, register, isLoading, isExiting, updateUser, deleteUser, awardPoints, refetchUsers: fetchUsers };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
