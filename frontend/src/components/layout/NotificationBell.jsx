// frontend/src/components/layout/NotificationBell.jsx
import React, { useState } from 'react';
import {
    Badge,
    IconButton,
    Popover,
    List,
    ListItem,
    ListItemText,
    Typography
} from '@mui/material';
import { Notifications as NotificationsIcon } from '@mui/icons-material';
import { useNotification } from '../../hooks/useNotification';

const NotificationBell = () => {
    const [anchorEl, setAnchorEl] = useState(null);
    const { notifications, unreadCount, markAsRead } = useNotification();

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleNotificationClick = (notification) => {
        if (!notification.dibaca) {
            markAsRead(notification.id_notifikasi);
        }
        handleClose();
    };

    const open = Boolean(anchorEl);

    return (
        <>
            <IconButton color="inherit" onClick={handleClick}>
                <Badge badgeContent={unreadCount} color="error">
                    <NotificationsIcon />
                </Badge>
            </IconButton>
            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
            >
                <List sx={{ width: 300, maxHeight: 400, overflow: 'auto' }}>
                    {notifications.length > 0 ? (
                        notifications.map((notification) => (
                            <ListItem
                                key={notification.id_notifikasi}
                                button
                                onClick={() => handleNotificationClick(notification)}
                                sx={{
                                    bgcolor: notification.dibaca ? 'inherit' : 'action.hover'
                                }}
                            >
                                <ListItemText
                                    primary={notification.judul}
                                    secondary={
                                        <>
                                            <Typography variant="body2" component="span">
                                                {notification.pesan}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                component="div"
                                                color="textSecondary"
                                            >
                                                {new Date(notification.created_at).toLocaleString()}
                                            </Typography>
                                        </>
                                    }
                                />
                            </ListItem>
                        ))
                    ) : (
                        <ListItem>
                            <ListItemText
                                primary="Tidak ada notifikasi"
                                sx={{ textAlign: 'center' }}
                            />
                        </ListItem>
                    )}
                </List>
            </Popover>
        </>
    );
};

export default NotificationBell;