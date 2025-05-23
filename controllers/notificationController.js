const Notification = require("../models/notificationModel");
const catchAsyncError = require("../utils/catchAsyncError");
const AppError = require("../utils/appError");

const getMyNotifications = catchAsyncError(async (req, res, next) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .populate("sender", "fullName")
    .populate("post", "title")
    .sort("-createdAt");

  res.status(200).json({
    status: "success",
    results: notifications.length,
    data: notifications,
  });
});

// Mark a single notification as read
const markNotificationAsRead = catchAsyncError(async (req, res, next) => {
  const notification = await Notification.findOneAndUpdate(
    {
      _id: req.params.id,
      recipient: req.user._id,
    },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    return next(new AppError("Notification not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: notification,
  });
});

// Mark all user notifications as read
const markAllNotificationsAsRead = catchAsyncError(async (req, res, next) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { $set: { isRead: true } }
  );

  res.status(200).json({
    status: "success",
    message: "All notifications marked as read",
  });
});

module.exports = {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};
