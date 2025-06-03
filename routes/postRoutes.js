const express = require("express");
const { protect, restrictTo } = require("../middlewares/authMiddlewares");
const {
  getPostByIdOrSlug,
  createPost,
  getAllPosts,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  bookmarkPost,
  unbookmarkPost,
  saveAsDraft,
  getMyDrafts,
  getMyBookmarks,
  publishDraft,
  getMyLikes,
  uploadPostImage,
  deleteDraft,
  editDraft,
  getUserPosts,
} = require("../controllers/postController");

const router = express.Router();

router.get("/my/drafts", protect, getMyDrafts);
router.get("/my/bookmarks", protect, getMyBookmarks);
router.get("/my/likes", protect, getMyLikes);

router.get("/my/posts", protect, getUserPosts); 

router
  .route("/")
  .get(getAllPosts)
  .post(protect, restrictTo("author", "admin"), uploadPostImage, createPost);

router.post(
  "/draft",
  protect,
  restrictTo("author", "admin"),
  uploadPostImage,
  saveAsDraft
);
router.post("/:id/like", protect, likePost);
router.delete("/:id/like", protect, unlikePost);
router.post("/:id/bookmark", protect, bookmarkPost);
router.delete("/:id/bookmark", protect, unbookmarkPost);

router.patch(
  "/:id/publishDraft",
  protect,
  restrictTo("author", "admin"),
  publishDraft
);
router
  .route("/:id")
  .get(getPostByIdOrSlug)
  .patch(protect, restrictTo("author", "admin"), uploadPostImage, updatePost)
  .delete(protect, restrictTo("admin", "author"), deletePost);
router.patch("/drafts/:id", protect, uploadPostImage, editDraft);
router.delete("/drafts/:id", protect, deleteDraft);

module.exports = router;

// GET /api/v1/posts?search=typescript&page=1&limit=10
// hit ths for searching posts by title or content
