const express = require("express");
const {
  createComment,
  getCommentsForPost,
  updateComment,
  deleteComment,
} = require("../controllers/commentController");
const { protect } = require("../middlewares/authMiddlewares");

const router = express.Router({ mergeParams: true });

router.route("/").get(getCommentsForPost).post(protect, createComment);
router
  .route("/:id")
  .patch(protect, updateComment)
  .delete(protect, deleteComment);

module.exports = router;
