const express = require("express");
const {
  uploadUserPhoto,
  getAllUsers,
  updateUser,
  deleteUser,
  getUser,
  updateMe,
  deleteMe,
  getMe,
} = require("../controllers/userController");
const { protect, restrictTo } = require("../middlewares/authMiddlewares");

//  User routes
const router = express.Router();

// Protect all Route After this Middleware
router.use(protect);

router.get("/me", getMe);
router.patch("/updateMe", uploadUserPhoto, updateMe);
router.delete("/deleteMe", deleteMe);

router.use(restrictTo("admin"));

router.route("/").get(getAllUsers);
router.route("/:id").get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;
