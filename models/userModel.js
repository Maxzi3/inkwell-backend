const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Please provide your full name"],
      trim: true,
      validate: {
        validator: function (value) {
          return value.split(" ").filter((word) => word).length >= 2;
        },
        message: "Please provide at least a first and last name",
      },
    },
    username: { type: String, required: true, unique: true },
    email: {
      type: String,
      required: [true, "Please provide your email"],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "Please enter a valid email"],
    },
    phoneNumber: {
      type: String,
      required: [true, "Please provide your phone number"],
    },
    avatar: {
      type: String,
      default:
        "https://res.cloudinary.com/dqmuagiln/image/upload/v1746451240/default_fxyc5v.jpg",
    },
    role: {
      type: String,
      enum: ["reader", "author", "admin"],
      default: "author",
    },
    bio: { type: String, default: "" },
    emailVerified: {
      type: String,
      enum: ["pending", "verified"],
      default: "pending",
    },
    welcomeEmailSent: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationTokenExpires: Date,
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: 8,
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, "Please confirm your password"],
      validate: {
        // This only works on Create and Save
        validator: function (el) {
          return el === this.password;
        },
        message: "Passwords do not match. Please re-enter.",
      },
    },
    passwordChangedAt: {
      type: Date,
    },
    passwordResetToken: String,
    passwordResetExpiresAt: Date,
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  {
    timestamps: true, //
  }
);

userSchema.pre("save", async function (next) {
  // Only run this function if password was modified
  if (!this.isModified("password")) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});
userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) {
    return next();
  }

  this.passwordChangedAt = Date.now() - 1000; // Prevent token issues
  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};
userSchema.methods.changePasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    console.log(this.passwordChangedAt, JWTTimestamp);
    const passwordChangeTimestamp = Math.floor(
      this.passwordChangedAt.getTime() / 1000
    );
    return JWTTimestamp < passwordChangeTimestamp; // True if password was changed AFTER token was issued
  }
  return false; // False means password wasn't changed
};

// Instance method: Create email verification token
userSchema.methods.createEmailVerificationToken = function () {
  const verificationToken = crypto.randomBytes(32).toString("hex");
  this.emailVerificationToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");
  this.emailVerificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return verificationToken;
};

// Instance method: Create password reset token
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken; // Send unhashed token to user
};

const User = mongoose.model("User", userSchema);
module.exports = User;
