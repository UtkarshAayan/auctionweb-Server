// routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/inAppNotificationController');


// Create a new notification

// Get notifications with filters (all, read, unread)
router.get('/notifications/:userId', notificationController.getNotifications);

// Mark a notification as read
router.post('/notifications/read/:id', notificationController.markAsRead);

// Delete a notification
router.delete('/notifications/:id', notificationController.deleteNotification);

// Clear all notifications
router.delete('/notifications/clear/:userId', notificationController.clearAllNotifications);

// Turn on notifications
router.post('/notifications/turnon', notificationController.turnOnNotifications);

// Turn off notifications
router.post('/notifications/turnoff', notificationController.turnOffNotifications);

module.exports = router;
