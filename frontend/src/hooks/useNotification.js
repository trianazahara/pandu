// src/hooks/useNotification.js
import { useState, useEffect } from 'react';

export const useNotification = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Fungsi fetch notifikasi
    const fetchNotifications = async () => {
        try {
            const response = await fetch('/api/notifications', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Gagal mengambil notifikasi');
            }

            const data = await response.json();
            setNotifications(data.notifications);
            setUnreadCount(data.unread);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    // Polling setiap menit
    useEffect(() => {
        // Jalankan pertama kali
        fetchNotifications();

        // Set interval polling
        const intervalId = setInterval(fetchNotifications, 60000); // 1 menit

        // Bersihkan interval saat komponen unmount
        return () => clearInterval(intervalId);
    }, []);

    // Fungsi mark as read
    const markAsRead = async (notificationId) => {
        try {
            const response = await fetch(`/api/notifications/${notificationId}/read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                // Refresh notifikasi setelah ditandai
                fetchNotifications();
            }
        } catch (error) {
            console.error('Error marking notification:', error);
        }
    };

    return {
        notifications,
        unreadCount,
        fetchNotifications,
        markAsRead
    };
};