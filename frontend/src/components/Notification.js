import React, { useEffect } from 'react';
import { useNotification } from './NotificationContext';
import './Notification.css';

const Notification = () => {
    const { notification, hideNotification } = useNotification();

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                hideNotification();
            }, 3000); // Auto-hide after 3 seconds

            return () => clearTimeout(timer);
        }
    }, [notification, hideNotification]);

    if (!notification) {
        return null;
    }

    return (
        <div className={`notification-container show ${notification.type}`}>
            {notification.message}
        </div>
    );
};

export default Notification;