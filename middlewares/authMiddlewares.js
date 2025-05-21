const User = require("../models/userModel");
const catchAsyncError = require("../utils/catchAsyncError");
const AppError = require("../utils/appError");
const { verifyAccessToken } = require("../utils/token");

const getToken = (req) => {
  if (req.headers.authorization?.startsWith("Bearer")) {
    return req.headers.authorization.split(" ")[1];
  }
  return null;
};

const protect = catchAsyncError(async (req, res, next) => {
  const token = getToken(req);
  
  if (!token)
    return next(
      new AppError("You are not logged in! Please log in to get access", 401)
    );

  const decoded = verifyAccessToken(token);

  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError("User no longer exists.", 401));
  }

  if (currentUser.changePasswordAfter(decoded.iat)) {
    return next(
      new AppError("User recently changed password! Please log in again.", 401)
    );
  }

  req.user = currentUser;
  next();
});

const restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }
    next();
  };

const isLoggedIn = catchAsyncError(async (req, res, next) => {
  const token = getToken(req);
  console.log(token);
  if (!token) return next();

  const decoded = verifyAccessToken(token);
  if (!decoded) return next();

  const user = await User.findById(decoded.id);
  if (!user || user.changePasswordAfter(decoded.iat)) return next();

  res.locals.user = user;
  console.log(res.locals.user);
  next();
});

module.exports = {
  protect,
  restrictTo,
  isLoggedIn,
};
