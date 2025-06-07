const crypto = require("crypto");
const User = require("../models/userModel");
const catchAsyncError = require("../utils/catchAsyncError");
const AppError = require("../utils/appError");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../utils/token");
const Email = require("../utils/email");

const createSendToken = (user, statusCode, res) => {
  const accessToken = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    secure: process.env.NODE_ENV === "production",
  };

  res.cookie("refreshToken", refreshToken, cookieOptions);

  // Remove password from response
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    accessToken,
    data: { user },
  });
};

const signUp = catchAsyncError(async (req, res, next) => {
  const { username, fullName, email, password, phoneNumber, passwordConfirm } =
    req.body;

  if (!username || !fullName || !email || !phoneNumber || !password)
    return next(new AppError("All fields are required", 400));

  const emailExists = await User.findOne({ email });
  if (emailExists) return next(new AppError("Email already in use", 400));

  const usernameExists = await User.findOne({ username });
  if (usernameExists) return next(new AppError("Username already taken", 400));

  const newUser = await User.create({
    fullName,
    username,
    email,
    password,
    phoneNumber,
    passwordConfirm,
  });

  const verificationToken = newUser.createEmailVerificationToken();
  await newUser.save({ validateBeforeSave: false });

  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
  await new Email(newUser, verificationUrl).sendEmailVerification();

  res.status(201).json({
    status: "success",
    message: "User registered. Please verify your email to complete signup.",
  });
});

const login = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  // Block login if email not verified
  if (user.emailVerified === "pending") {
    return next(
      new AppError("Please verify your email before logging in.", 401)
    );
  }

  createSendToken(user, 200, res);
});

const logout = (req, res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    secure: process.env.NODE_ENV === "production",
  });
  res.status(200).json({ status: "success" });
};

const refreshToken = catchAsyncError(async (req, res, next) => {
  const token = req.cookies.refreshToken;
  

  if (!token) return next(new AppError("No refresh token found", 401));

  try {
    const decoded = verifyRefreshToken(token);

    const newAccessToken = signAccessToken(decoded.id);

    res.status(200).json({
      status: "success",
      accessToken: newAccessToken,
    });
  } catch (err) {
    return next(new AppError("Invalid or expired refresh token", 403));
  }
});

const forgotPassword = catchAsyncError(async (req, res, next) => {
  // 1) Get user based on email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("No user found with that email", 404));
  }

  // 2) Generate password reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Create reset URL
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  try {
    await new Email(user, resetUrl).sendPasswordReset();
    res.status(200).json({
      status: "success",
      message: "Password reset link sent to email",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        "There was an error sending the email. Try again later!",
        500
      )
    );
  }
});

const resetPassword = catchAsyncError(async (req, res, next) => {
  // 1)Get user based on the token
  const hashToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashToken,
    passwordResetExpiresAt: { $gt: Date.now() },
  });

  // 2)If token has not expired and there is a user  Set the new password
  if (!user) {
    return next(new AppError("Token is Invalid or expired", 404));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpiresAt = undefined;
  await user.save();

  // 4) Login the user using the new password
  createSendToken(user, 200, res);
});

const updatePassword = catchAsyncError(async (req, res, next) => {
  // 1 Get user from collection
  const user = await User.findById(req.user.id).select("+password");

  // 2 Check if posted current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError("Your password is wrong.", 401));
  }

  // 3 If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // ✅ 4 Send back response
  res.status(200).json({
    status: "success",
    message: "Password updated successfully",
  });
});


const verifyEmail = catchAsyncError(async (req, res, next) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationTokenExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }

  if (user.emailVerified === "verified") {
    res.status(200).json({
      status: "success",
      verified: true,
      redirectTo: `${process.env.FRONTEND_URL}/login?alreadyVerified=true`,
    });
  }

  user.emailVerified = "verified";
  user.emailVerificationToken = undefined;
  user.emailVerificationTokenExpires = undefined;

  // Send welcome email
  if (!user.welcomeEmailSent) {
    const welcomeUrl = `${process.env.FRONTEND_URL}`;
    await new Email(user, welcomeUrl).sendWelcome();
    user.welcomeEmailSent = true;
  }

  await user.save({ validateBeforeSave: false });

  // ✅ Redirect to login page with a query flag
  res.status(200).json({
    status: "success",
    verified: true,
    redirectTo: `${process.env.FRONTEND_URL}/login?verified=true`,
  });
});

const resendEmailVerification = catchAsyncError(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return next(new AppError("User not found", 404));
  if (user.emailVerified === "verified")
    return next(new AppError("Email already verified", 400));

  const verificationToken = user.createEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
  await new Email(user, verificationUrl).sendEmailVerification();

  res.status(200).json({
    status: "success",
    message: "Verification email resent",
  });
});

module.exports = {
  signUp,
  login,
  logout,
  resetPassword,
  forgotPassword,
  updatePassword,
  verifyEmail,
  resendEmailVerification,
  refreshToken,
};
