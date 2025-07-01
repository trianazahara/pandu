// src/services/apiService.js

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// == OTENTIKASI ==
export const loginUser = (username, password) => axios.post(`${API_URL}/api/auth/login`, { username, password });
export const getMe = () => apiClient.get('/auth/me');
export const resetPassword = (resetData) => axios.post(`${API_URL}/api/auth/reset-password`, resetData);
export const checkUsername = (username) => axios.post(`${API_URL}/api/auth/check-username`, { username });
export const requestPasswordReset = (username) => axios.post(`${API_URL}/api/auth/forgot-password`, { username });

// == DASHBOARD ==
export const getDashboardStats = () => apiClient.get('/intern/detailed-stats');

// == MANAJEMEN ADMIN ==
export const getAdmins = () => apiClient.get('/admin');
export const createAdmin = (adminData) => apiClient.post('/admin', adminData);
export const updateAdmin = (id, adminData) => apiClient.patch(`/admin/${id}`, adminData);
export const deleteAdmin = (id) => apiClient.delete(`/admin/${id}`);
export const getMentors = () => apiClient.get('/admin/mentors');

// == MANAJEMEN PESERTA MAGANG (INTERN) ==
export const getInterns = (params) => apiClient.get('/intern', { params });
export const getInternById = (id) => apiClient.get(`/intern/${id}`);
export const addIntern = (internData) => apiClient.post('/intern/add', internData);
export const updateIntern = (id, internData) => apiClient.put(`/intern/${id}`, internData);
export const deleteIntern = (id) => apiClient.delete(`/intern/${id}`);
export const setInternAsMissing = (id) => apiClient.patch(`/intern/missing/${id}`);
export const checkInternAvailability = (date) => apiClient.get(`/intern/check-availability?date=${date}`);
export const getCompletedInterns = () => apiClient.get('/intern', { params: { status: 'selesai' } });

// == PENILAIAN & DOKUMEN ==
export const submitAssessment = (idMagang, assessmentData) => apiClient.post(`/assessment/${idMagang}`, assessmentData);
// export const generateCertificate = (idMagang) => apiClient.post(`/document/certificate/${idMagang}`, {}, { responseType: 'blob' });
export const generateInternReceipt = (internIds) => apiClient.post('/intern/generate-receipt', { internIds }, { responseType: 'blob' });

// == ARSIP ==
export const getArchives = (params) => apiClient.get('/archives', { params });
export const getArchiveBidangList = () => apiClient.get('/archives/bidang');
export const deleteCertificate = (idMagang) => apiClient.delete(`/archives/${idMagang}`);
export const downloadCertificate = (idMagang) => {
  return apiClient.get(`/archives/download/${idMagang}`, {
    responseType: 'blob', // Penting karena kita mengharapkan file
  });
};

// Mengambil data rekap nilai dengan filter & paginasi
export const getRekapNilai = (params) => apiClient.get('/intern/rekap-nilai', { params });

// Mengupdate skor/nilai penilaian
export const updateNilai = (idPenilaian, scoreData) => apiClient.put(`/intern/update-nilai/${idPenilaian}`, scoreData);

// Export data rekap nilai ke Excel
export const exportRekapNilai = (params) => apiClient.get('/intern/export', {
  responseType: 'blob', // Penting karena kita mengharapkan file
  params
});

// Upload file sertifikat
export const uploadArsipSertifikat = (idMagang, formData) => {
  // Untuk file upload, kita perlu header 'multipart/form-data'
  // Axios akan menanganinya otomatis jika kita mengirim FormData
  return apiClient.post(`/upload/arsip-sertifikat/${idMagang}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Export data laporan umum dengan filter
export const exportReport = (params) => apiClient.get('/report/export', {
  responseType: 'blob', // Penting karena kita mengharapkan file
  params
});


// Mengambil data profile user
export const getProfile = () => apiClient.get('/profile');

// Mengupdate data profile user
export const updateProfile = (profileData) => apiClient.patch('/profile', profileData);

// Mengubah password
export const changePassword = (passwordData) => apiClient.patch('/profile/change-password', passwordData);

// Mengupload foto profil baru
export const uploadProfilePhoto = (formData) => apiClient.post('/profile/photo-profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});

// Menghapus foto profil
export const deleteProfilePhoto = () => apiClient.delete('/profile/photo-profile');

// Mengambil daftar template dokumen
export const getDocumentTemplates = () => apiClient.get('/document/templates');

// Mengupload template dokumen baru
export const uploadDocumentTemplate = (formData, onUploadProgress) => {
    return apiClient.post('/document/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress // Untuk menampilkan progress bar
    });
};

// Menghapus template dokumen
export const deleteDocumentTemplate = (templateId) => apiClient.delete(`/document/template/${templateId}`);

// URL untuk preview dokumen (ini bukan panggilan API langsung, hanya helper)
export const getDocumentPreviewUrl = (templateId) => `${API_URL}/api/document/preview/${templateId}`;

export const getRiwayatData = (params) => apiClient.get('/intern/riwayat-data', { params });
export const addOrUpdateScore = (idMagang, scoreData) => apiClient.post(`/intern/add-score/${idMagang}`, scoreData);
// == FUNGSI BERSAMA (SHARED) ==
export const getBidangList = () => apiClient.get('/bidang');


// Mengambil daftar notifikasi dengan paginasi
export const getNotifications = (params) => apiClient.get('/notifications', { params });

// Mengambil jumlah notifikasi yang belum dibaca
export const getUnreadNotificationCount = () => apiClient.get('/notifications/unread-count');

// Menandai semua notifikasi sebagai sudah dibaca
export const markAllNotificationsAsRead = () => apiClient.put('/notifications/mark-all-read');


export const generateCertificate = (idMagang) => {
  // TAMBAHKAN '/document' di sini
  return apiClient.post(`/document/generate-sertifikat/${idMagang}`); 
};

// FUNGSI DOWNLOAD (Path sudah diperbaiki dengan /document)
export const downloadGeneratedCertificate = (idMagang) => {
  // TAMBAHKAN '/document' di sini
  return apiClient.get(`/document/download-sertifikat/${idMagang}`, {
    responseType: 'blob', 
  });
};