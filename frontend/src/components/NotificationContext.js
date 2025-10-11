import React, { createContext, useState, useContext, useCallback } from 'react';

const NotificationContext = createContext();

export const useNotification = () => {
    return useContext(NotificationContext);
};

export const NotificationProvider = ({ children }) => {
    const [notification, setNotification] = useState(null);

    const showNotification = useCallback((message, type = 'success') => {
        setNotification({ message, type, id: Date.now() });
    }, []);

    const hideNotification = () => {
        setNotification(null);
    }

    const value = { showNotification, notification, hideNotification };

    return (
        <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
    );
};