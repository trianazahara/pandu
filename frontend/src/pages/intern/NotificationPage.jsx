import React, { useEffect, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import axios from 'axios';

const NotificationPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10
  });

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/notifications`, {
        params: {
          page,
          limit: pagination.limit
        },
        headers: { 
          Authorization: `Bearer ${token}` 
        }
      });

      if (response.data.status === 'success') {
        setNotifications(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/notifications/${id}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setNotifications(prevNotifications =>
        prevNotifications.map(notif =>
          notif.id_notifikasi === id ? { ...notif, dibaca: 1 } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/notifications/mark-all-read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setNotifications(prevNotifications =>
        prevNotifications.map(notif => ({ ...notif, dibaca: 1 }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [page]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPage(newPage);
      window.scrollTo(0, 0);
    }
  };

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxButtons = 5;
    let startPage = Math.max(1, pagination.currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxButtons - 1);

    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    if (pagination.currentPage > 1) {
      buttons.push(
        <button
          key="first"
          onClick={() => handlePageChange(1)}
          className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
        >
          Pertama
        </button>
      );
    }

    buttons.push(
      <button
        key="prev"
        onClick={() => handlePageChange(pagination.currentPage - 1)}
        disabled={pagination.currentPage === 1}
        className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
    );

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`w-8 h-8 rounded ${
            pagination.currentPage === i
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          {i}
        </button>
      );
    }

    buttons.push(
      <button
        key="next"
        onClick={() => handlePageChange(pagination.currentPage + 1)}
        disabled={pagination.currentPage === pagination.totalPages}
        className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    );

    if (pagination.currentPage < pagination.totalPages) {
      buttons.push(
        <button
          key="last"
          onClick={() => handlePageChange(pagination.totalPages)}
          className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
        >
          Terakhir
        </button>
      );
    }

    return buttons;
  };

  const hasUnreadNotifications = notifications.some(notif => !notif.dibaca);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notifikasi</h1>
              <p className="text-sm text-gray-500 mt-1">
                Semua aktivitas dan pemberitahuan terkait peserta magang
              </p>
            </div>
            {hasUnreadNotifications && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Tandai semua sudah dibaca
              </button>
            )}
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Tidak ada notifikasi
            </div>
          ) : (
            <div>
              {notifications.map((notification) => (
                <div
                  key={notification.id_notifikasi}
                  className={`p-6 hover:bg-gray-50 transition-colors ${
                    !notification.dibaca ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">
                        {notification.judul}
                      </h3>
                      {!notification.dibaca && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-medium">
                          Baru
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600">{notification.pesan}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {new Date(notification.created_at).toLocaleString('id-ID', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {!notification.dibaca && (
                        <button
                          onClick={() => markAsRead(notification.id_notifikasi)}
                          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                        >
                          <Check className="w-4 h-4" />
                          Tandai sudah dibaca
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-sm text-gray-700">
                Menampilkan {(pagination.currentPage - 1) * pagination.limit + 1} - {Math.min(pagination.currentPage * pagination.limit, pagination.totalItems)} dari {pagination.totalItems} notifikasi
              </span>
              <div className="flex items-center gap-2">
                {renderPaginationButtons()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPage;