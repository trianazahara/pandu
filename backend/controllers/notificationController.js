const Notification = require('../models/Notification');
const Intern = require('../models/Intern');
const User = require('../models/User');

const notificationController = {
    getNotifications: async (req, res) => {
        try {
            const { page = 1, limit = 10, status = 'all' } = req.query;

            const result = await Notification.getByUser(req.user.id, { page, limit, status });

            res.json({
                status: 'success',
                ...result
            });
        } catch (error) {
            console.error('Error fetching notifications:', error);
            res.status(500).json({
                status: 'error',
                message: 'Gagal mengambil notifikasi'
            });
        }
    },

    markAsRead: async (req, res) => {
        try {
            const { id } = req.params;
            const success = await Notification.markAsRead(id, req.user.id);

            if (success) {
                res.json({
                    status: 'success',
                    message: 'Notifikasi ditandai sebagai dibaca'
                });
            } else {
                res.status(404).json({
                    status: 'error',
                    message: 'Notifikasi tidak ditemukan'
                });
            }
        } catch (error) {
            console.error('Error marking notification:', error);
            res.status(500).json({
                status: 'error',
                message: 'Gagal menandai notifikasi'
            });
        }
    },

    getUnreadCount: async (req, res) => {
        try {
            const [result] = await db.execute(
                'SELECT COUNT(*) as count FROM notifikasi WHERE user_id = ? AND is_read = 0',
                [req.user.id]
            );

            res.json({
                status: 'success',
                count: result[0].count
            });
        } catch (error) {
            console.error('Error getting unread count:', error);
            res.status(500).json({
                status: 'error',
                message: 'Gagal mengambil jumlah notifikasi'
            });
        }
    },

    createNotifications: async () => {
        try {
            // New interns
            const newInterns = await Intern.findAll({ status: 'new' });
            newInterns.data.forEach(async (intern) => {
                await Notification.createNotification(intern.user_id, 'new_intern', `Peserta magang baru: ${intern.nama}`);
            });

            // Interns finishing in 7 days
            const finishingInterns = await Intern.findAll({
                status: 'active',
                endDate: { $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
            });
            finishingInterns.data.forEach(async (intern) => {
                await Notification.createNotification(intern.user_id, 'ending_soon', `Peserta magang ${intern.nama} akan selesai dalam 7 hari`);
            });

            // Completed interns
            const completedInterns = await Intern.findAll({ status: 'completed' });
            completedInterns.data.forEach(async (intern) => {
                await Notification.createNotification(intern.user_id, 'completed_intern', `Peserta magang ${intern.nama} telah selesai`);
            });

            // Admins who have given ratings
            const admins = await User.find({ role: 'admin', hasGivenRating: true });
            admins.forEach(async (admin) => {
                await Notification.createNotification(admin.id_users, 'evaluation_completed', `Admin ${admin.nama} telah memberikan nilai kepada peserta magang`);
            });
        } catch (error) {
            console.error('Error creating notifications:', error);
        }
    }
};

module.exports = notificationController;