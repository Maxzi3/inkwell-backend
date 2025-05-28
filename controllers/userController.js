const multer = require("multer");
const { resizeImage, uploadToCloudinary } = require("../utils/cloudinary");
const User = require("./../models/userModel");
const catchAsyncError = require("../utils/catchAsyncError");
const AppError = require("../utils/appError");
const factory = require("./factoryController");

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload only images.", 400), false);
  }
};

const storage = multer.memoryStorage();
const upload = multer({ storage, fileFilter: multerFilter });
const uploadUserPhoto = upload.single("avatar");

const getMe = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("-password");

  if (!user) return next(new AppError("User not found", 404));

  res.status(200).json({
    status: "success",
    data: { user },
  });
});

const updateMe = catchAsyncError(async (req, res, next) => {

  // 1) Prevent password updates through this route

  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for password updates. Please use /updateMyPassword.",
        400
      )
    );
  }

  if (req.body.email) {
    return next(new AppError("You cannot change your email address", 400));
  }

  // 2) Filter unwanted fields that shouldn't be updated
  const filteredBody = filterObj(
    req.body,
    "fullName",
    "address",
    "phoneNumber",
    "bio",
    "username",
  );

  if (req.file) {
    const resizedBuffer = await resizeImage(req.file.buffer);
    const uploadResult = await uploadToCloudinary(
      resizedBuffer,
      `user-${req.user.id}-${Date.now()}`,
      "users"
    );

    if (uploadResult.error || !uploadResult.secure_url) {
      return next(new AppError("Failed to upload image", 500));
    }

    filteredBody.avatar = uploadResult.secure_url; // <<-- Push to filteredBody
  }

  // 3) Update the user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true, // Return updated user
    runValidators: true, // Validate new data
  });

  if (!updatedUser) {
    return next(new AppError("User not found", 404));
  }
  
  // 4) Send response with updated user
  res.status(200).json({
    status: "success",
    data: { user: updatedUser },
  });
});

const deleteMe = catchAsyncError(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, {
    active: false,
  });
  res.status(204).json({ status: "success", message: "User deleted" });
});

const updateUser = factory.updateOne(User);
const deleteUser = factory.deleteOne(User);
const getUser = factory.getOne(User);
const getAllUsers = factory.getAll(User);

module.exports = {
  uploadUserPhoto,
  getAllUsers,
  updateUser,
  deleteUser,
  getUser,
  updateMe,
  deleteMe,
  getMe,
};
