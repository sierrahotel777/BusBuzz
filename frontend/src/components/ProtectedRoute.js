import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = ({ children, role }) => {
    const { user } = useAuth();

    if (!user) {
        
        return <Navigate to="/" />;
    }

    if (role && user.role !== role) {
       
        return <Navigate to={user.role === 'admin' ? '/admin' : '/student'} />;
    }

    return children;
};

export default ProtectedRoute;