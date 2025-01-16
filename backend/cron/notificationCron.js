// cron/notificationCron.js
const cron = require('node-cron');
const Notification = require('../models/Notification');

class NotificationCron {
    constructor(wsServer) {
        this.wsServer = wsServer;
    }

    start() {
        // Run every hour
        cron.schedule('0 * * * *', async () => {
            try {
                console.log('Running notification check cron job...');
                await Notification.checkAndCreateInternshipNotifications(this.wsServer);
            } catch (error) {
                console.error('Error in notification cron job:', error);
            }
        });

        // Run daily cleanup at midnight
        cron.schedule('0 0 * * *', async () => {
            try {
                console.log('Running notification cleanup cron job...');
                await this.cleanupOldNotifications();
            } catch (error) {
                console.error('Error in cleanup cron job:', error);
            }
        });
    }

    async cleanupOldNotifications() {
        try {
            // Delete notifications older than 30 days
            await db.execute(`
                DELETE FROM notifikasi 
                WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
            `);
        } catch (error) {
            console.error('Error cleaning up notifications:', error);
            throw error;
        }
    }
}

module.exports = NotificationCron