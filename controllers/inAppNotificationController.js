// controllers/notificationController.js
const InAppNotification = require('../models/inAppNotificationModel');
const User = require('../models/userModel');
const createError = require('../middleware/error')
const createSuccess = require('../middleware/success')


// Create a new notification
// exports.createNotification = async (req, res,next) => {
//   try {
//     const { userId, message } = req.body;

//     // Check if notifications are enabled for the user
//     const user = await User.findById(userId);
//     if (!user) {
//       return next(createSuccess(404, "User not found"));
//     }

//     if (!user.notificationsEnabled) {
//       return next(createSuccess(403, "Notifications are turned off for this user"));
//     }

//     // If notifications are enabled, create the notification
//     const notification = new InAppNotification({ userId, message });
//     await notification.save();
//     return next(createSuccess(200, "Notifications Created", notification));
//   } catch (error) {
//     return next(createError(500, "Failed to create notification"))
//   }
// };


exports.getNotifications = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { filter = 'all' } = req.query; // Default filter is 'all'

    // Construct query object
    let query = { userId }; // Only fetch active notifications

    // Apply filter based on the query parameter
    if (filter === 'read') {
      query.read = true;
    } else if (filter === 'unread') {
      query.read = false;
    }

    // Fetch notifications from the database
    const notifications = await InAppNotification.find(query).sort({ createdAt: -1 });

    // Return notifications with 200 status and empty array if none are found
    return res.status(200).json({
      message: "Notifications",
      data: notifications || []
    });
  } catch (error) {
    console.error('Error fetching notifications:', error.message);
    return res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

  
  

// Mark a notification as read
exports.markAsRead = async (req, res,next) => {
  try {
    const { id } = req.params;
    const notification = await InAppNotification.findByIdAndUpdate(id, { read: true }, { new: true });
    return next(createSuccess(200, "Marked as read", notification));
  } catch (error) {
    return next(createError(500, "Failed to mark notification as read"))
  }
};

// Delete a notification
exports.deleteNotification = async (req, res,next) => {
  try {
    const { id } = req.params;
    await InAppNotification.findByIdAndDelete(id);
    return next(createSuccess(200, "Notification deleted successfully"));
  } catch (error) {
    return next(createError(500, "Failed to delete notification"))
  }
};

// Clear all notifications for a user
exports.clearAllNotifications = async (req, res,next) => {
  try {
    const { userId } = req.params;
    await InAppNotification.deleteMany({ userId });
    return next(createSuccess(200, "All notifications cleared successfully"));
  } catch (error) {
    return next(createError(500, "Failed to clear notifications"))
  }
};

// Turn on notifications
exports.turnOnNotifications = async (req, res,next) => {
  try {
    const { userId } = req.body;

    const user = await User.findByIdAndUpdate(userId, { notificationsEnabled: true }, { new: true });
    if (!user) {
      return next(createError(404, "User not found"))
    }
    return next(createSuccess(200, "Notifications turned on", user));
  } catch (error) {
    return next(createError(500, "Failed to turn on notifications"))
  }
};

// Turn off notifications
exports.turnOffNotifications = async (req, res,next) => {
  try {
    const { userId } = req.body;

    const user = await User.findByIdAndUpdate(userId, { notificationsEnabled: false }, { new: true });
    if (!user) {
      return next(createSuccess(404, "User not found"));
    }
    return next(createSuccess(200, "Notifications turned off", user));
  } catch (error) {
    return next(createError(500, "Failed to turn off notifications"))
  }
};
