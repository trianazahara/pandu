// config/websocket.js
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

class WebSocketServer {
    constructor(server) {
        this.wss = new WebSocket.Server({ server });
        this.clients = new Map(); 

        this.wss.on('connection', (ws, req) => {
            this.handleConnection(ws, req);
        });
    }

    handleConnection(ws, req) {
        const url = new URL(req.url, 'ws://localhost');
        const token = url.searchParams.get('token');

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const userId = decoded.id;

            this.clients.set(userId, ws);

            ws.on('close', () => {
                this.clients.delete(userId);
            });

        } catch (error) {
            ws.close();
        }
    }

    sendNotification(userId, notification) {
        const client = this.clients.get(userId);
        if (client && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(notification));
        }
    }

    broadcastToAdmins(notification, adminIds) {
        adminIds.forEach(adminId => {
            this.sendNotification(adminId, notification);
        });
    }
}

module.exports = WebSocketServer;