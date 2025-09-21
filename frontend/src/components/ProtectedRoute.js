import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = ({ children, role }) => {
    const { user } = useAuth();

    if (!user) {
        // User not logged in, redirect to login page
        return <Navigate to="/" />;
    }

    if (role && user.role !== role) {
        // User does not have the required role, redirect to their default dashboard
        return <Navigate to={user.role === 'admin' ? '/admin' : '/student'} />;
    }

    return children;
};

export default ProtectedRoute;