// config/websocket.js
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

class WebSocketServer {
    constructor(server) {
        this.wss = new WebSocket.Server({ server });
        this.clients = new Map(); // Map to store client connections

        this.wss.on('connection', (ws, req) => {
            this.handleConnection(ws, req);
        });
    }

    handleConnection(ws, req) {
        // Get token from query string
        const url = new URL(req.url, 'ws://localhost');
        const token = url.searchParams.get('token');

        try {
            // Verify JWT token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const userId = decoded.id;

            // Store client connection
            this.clients.set(userId, ws);

            ws.on('close', () => {
                this.clients.delete(userId);
            });

        } catch (error) {
            ws.close();
        }
    }

    // Send notification to specific user
    sendNotification(userId, notification) {
        const client = this.clients.get(userId);
        if (client && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(notification));
        }
    }

    // Broadcast notification to all connected admin users
    broadcastToAdmins(notification, adminIds) {
        adminIds.forEach(adminId => {
            this.sendNotification(adminId, notification);
        });
    }
}

module.exports = WebSocketServer;