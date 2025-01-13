// frontend/src/hooks/useNotification.js
import { useState, useEffect } from 'react';

export const useNotification = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        try {
            const response = await fetch('/api/notifications');
            const data = await response.json();
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.dibaca).length);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            await fetch(`/api/notifications/${notificationId}/read`, {
                method: 'PUT'
            });
            fetchNotifications();
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll for new notifications every minute
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    return {
        notifications,
        unreadCount,
        markAsRead,
        refresh: fetchNotifications
    };
};