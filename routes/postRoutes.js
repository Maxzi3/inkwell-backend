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
  saveAsDraft,
  getMyDrafts,
  getMyBookmarks,
  publishDraft,
  getMyLikes,
} = require("../controllers/postController");

const router = express.Router();

router.get("/my/drafts", protect, getMyDrafts);
router.get("/my/bookmarks", protect, getMyBookmarks);
router.get("/my/likes", protect, getMyLikes);

router
  .route("/")
  .get(getAllPosts)
  .post(protect, restrictTo("author", "admin"), createPost);

router.post("/draft", protect, restrictTo("author", "admin"), saveAsDraft);
router.patch("/:id/like", protect, toggleLike);
router.patch("/:id/bookmark", protect, toggleBookmark);
router.patch(
  "/:id/publish",
  protect,
  restrictTo("author", "admin"),
  publishDraft
);
router
  .route("/:id")
  .get(getPostByIdOrSlug)
  .patch(protect, restrictTo("author", "admin"), updatePost)
  .delete(protect, restrictTo("admin", "author"), deletePost);

module.exports = router;
