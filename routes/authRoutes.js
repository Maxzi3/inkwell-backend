const express = require("express");
const {
  signUp,
  login,
  logout,
  resetPassword,
  forgotPassword,
  updatePassword,
  verifyEmail,
  resendEmailVerification,
  refreshToken,
} = require("../controllers/authController");
const { isLoggedIn, protect } = require("../middlewares/authMiddlewares");

const router = express.Router();

router.post("/signup", signUp);
router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.get("/logout", logout);
router.post("/forgotPassword", forgotPassword);
router.post("/resend-verification", resendEmailVerification);
router.patch("/updateMyPassword", protect, updatePassword);

router.get("/check-auth", isLoggedIn, (req, res) => {
  if (!res.locals?.user) {
    return res.status(200).json({ isAuthenticated: false, user: null });
  }

  res.status(200).json({
    isAuthenticated: true,
    user: {
      name: res.locals.user.fullName,
      email: res.locals.user.email,
      avatar: res.locals.user.avatar,
    },
  });
});

router.get("/verify-email/:token", verifyEmail);
router.patch("/reset-password/:token", resetPassword);

module.exports = router;
