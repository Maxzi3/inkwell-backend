const express = require("express");
const { protect, restrictTo } = require("../middlewares/authMiddlewares");
const {
  getPostByIdOrSlug,
  createPost,
  getAllPosts,
  updatePost,
  deletePost,
  toggleLike,
  toggleBookmark,
  toggleDraftStatus,
  getMyDrafts,
  getMyBookmarks,
} = require("../controllers/postController");

const router = express.Router();

router.get("/my-drafts", protect, getMyDrafts);
router.get("/my-bookmarks", protect, getMyBookmarks);

router
  .route("/")
  .get(getAllPosts)
  .post(protect, restrictTo("author", "admin"), createPost);

router.patch(
  "/:id/toggle-draft",
  protect,
  restrictTo("author", "admin"),
  toggleDraftStatus
);
router.patch("/:id/like", protect, toggleLike);
router.patch("/:id/bookmark", protect, toggleBookmark);

router
  .route("/:id")
  .get(getPostByIdOrSlug)
  .patch(protect, restrictTo("author", "admin"), updatePost)
  .delete(protect, restrictTo("admin"), deletePost);

module.exports = router;
