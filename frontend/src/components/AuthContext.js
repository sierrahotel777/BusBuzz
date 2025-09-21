import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Mock user database
const initialUsers = [
    { id: 1, email: 'student@college.com', password: 'password123', name: 'Ruthwik V', role: 'student', collegeId: 'U202112345', busRoute: 'S1: VALASARAVAKKAM', favoriteStop: 'VADAPALANI', points: 125, provider: 'email' },
    { id: 2, email: 'admin@college.com', password: 'admin123', name: 'Admin User', role: 'admin', collegeId: 'A001', points: 0, provider: 'email' },
    { id: 3, email: 'sundar.p@google.com', provider: 'google', name: 'Sundar Pichai', role: 'student', collegeId: 'G2023001', busRoute: 'S7: AVADI', favoriteStop: 'AMBATTUR', points: 50 },
    { id: 4, email: 'tim.c@apple.com', provider: 'apple', name: 'Tim Cook', role: 'student', collegeId: 'A2023001', busRoute: 'S6: ANNA NAGAR WEST', favoriteStop: 'CMBT', points: 75 }
];

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [users, setUsers] = useState(() => {
        const savedUsers = localStorage.getItem('busbuzz-users');
        return savedUsers ? JSON.parse(savedUsers) : initialUsers;
    });
    const [user, setUser] = useState(() => {
        try {
            const savedUser = localStorage.getItem('busbuzz-user');
            return savedUser ? JSON.parse(savedUser) : null;
        } catch (error) {
            console.error("Failed to parse user from localStorage", error);
            return null;
        }
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isExiting, setIsExiting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Persist the users list to localStorage
        localStorage.setItem('busbuzz-users', JSON.stringify(users));
    }, [users]);

    // This effect runs once on app load to signal that the initial user check is complete.
    useEffect(() => {
        // The user state is initialized synchronously, so we can immediately set loading to false.
        setIsLoading(false);
    }, []);

    // Effect to update localStorage whenever the user object changes
    useEffect(() => {
        if (user) {
            localStorage.setItem('busbuzz-user', JSON.stringify(user));
        } else {
            localStorage.removeItem('busbuzz-user');
        }
    }, [user]);

    // Effect to periodically update the 'lastActive' timestamp
    useEffect(() => {
        if (!user) return;

        const updateLastActive = () => {
            // Using functional update to get the latest state
            setUser(currentUser => {
                if (!currentUser) return null;
                return { ...currentUser, lastActive: new Date().toISOString() };
            });
        };

        const interval = setInterval(updateLastActive, 60000); // Update every 60 seconds

        return () => clearInterval(interval);
    }, [user]); // Re-run when user object changes

    const login = (email, password) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => { // Simulate network delay
                const foundUser = users.find(u => u.email === email && u.password === password);
                if (foundUser) {
                    setUser({ ...foundUser, lastActive: new Date().toISOString() });
                    resolve(foundUser);
                } else {
                    reject(new Error("Invalid email or password."));
                }
            }, 1000);
        });
    };

    const logout = () => {
        setIsExiting(true);
        setTimeout(() => {
            setUser(null);
            navigate('/');
            setIsExiting(false);
        }, 500); // Match animation duration
    };

    const updateUser = (updatedUserData) => {
        setUsers(currentUsers => currentUsers.map(u => u.id === updatedUserData.id ? { ...u, ...updatedUserData } : u));
        // also update the currently logged in user if they are the one being edited
        if (user && user.id === updatedUserData.id) {
            setUser(currentUser => ({ ...currentUser, ...updatedUserData }));
        }
    };

    const deleteUser = (userId) => {
        setUsers(currentUsers => currentUsers.filter(u => u.id !== userId));
    };

    const addUser = (newUserData) => {
        setUsers(currentUsers => [...currentUsers, { ...newUserData, id: Date.now() }]);
    };

    const awardPoints = (pointsToAward) => {
        if (!user) return;
        const updatedUser = { ...user, points: (user.points || 0) + pointsToAward };
        setUser(updatedUser); // This will trigger the localStorage update for the current user
        // Also update the master users list
        setUsers(currentUsers => currentUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
    };


    const value = { user, users, login, logout, isLoading, isExiting, addUser, updateUser, deleteUser, awardPoints };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    return useContext(AuthContext);
};