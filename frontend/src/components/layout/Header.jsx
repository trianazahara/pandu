// frontend/src/components/layout/Header.jsx
import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
// Import NotificationDropdown jika dipisahkan
// import NotificationDropdown from './NotificationBell'; 

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications?page=1&limit=5', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data = await response.json();
      setNotifications(data.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications/unread-count', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch unread count');
      const data = await response.json();
      setUnreadCount(data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to mark notification as read');
      setNotifications((prevNotifications) =>
        prevNotifications.map((notif) =>
          notif.id === id ? { ...notif, is_read: true } : notif
        )
      );
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-0 right-0 left-64 bg-white border-b z-10">
      <div className="flex justify-end items-center p-1 mr-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            {/* Bell Icon with Badge */}
            <button
              onClick={() => {
                setIsOpen(!isOpen);
                if (!isOpen) fetchNotifications();
              }}
              className="relative p-2 rounded-full hover:bg-gray-100 focus:outline-none"
            >
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {isOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                <div className="px-4 py-2 border-b border-gray-200">
                  <h3 className="text-lg font-semibold">Notifikasi</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {loading ? (
                    <div className="p-4 text-center text-gray-500">Loading...</div>
                  ) : notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      Tidak ada notifikasi
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => markAsRead(notification.id)}
                        className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                          !notification.is_read ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="font-semibold">{notification.title}</div>
                        <div className="text-sm text-gray-600">
                          {notification.message}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(notification.created_at).toLocaleString('id-ID')}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="p-2 text-center border-t border-gray-200">
                    <button
                      onClick={() => (window.location.href = '/notifications')}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Lihat Semua Notifikasi
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-gray-700">Admin</p>
              <p className="text-gray-500 text-sm">Admin</p>
            </div>
            <div className="relative">
              <img
                src="/avatar.jpg"
                alt="Profile"
                className="w-10 h-10 rounded-full"
              />
              <button className="ml-1">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
