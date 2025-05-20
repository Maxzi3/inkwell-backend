const express = require("express");
const {
  signUp,
  login,
  logout,
  forgotPassword,
  verifyEmail,
  resendEmailVerification,
  resetPassword,
  refreshToken,
} = require("../controllers/authController");
const { isLoggedIn } = require("../middlewares/authMiddlewares");

const router = express.Router();

router.post("/signup", signUp);
router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.get("/logout", logout);
router.post("/forgotPassword", forgotPassword);
router.get("/verify-email/:token", verifyEmail);
router.post("/resend-verification", resendEmailVerification);
router.patch("/resetPassword/:token", resetPassword);
router.get("/check-auth", isLoggedIn, (req, res) => {
  if (!res.locals?.user) {
    return res.status(200).json({ isAuthenticated: false, user: null });
  }

  res.status(200).json({
    isAuthenticated: true,
    user: {
      name: req.locals.user.fullName,
      email: req.locals.user.email,
      avatar: req.locals.user.avatar,
    },
  });
});

module.exports = router;
