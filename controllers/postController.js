const mongoose = require("mongoose");
const Post = require("../models/postModel");
const factory = require("./factoryController");
const catchAsyncError = require("../utils/catchAsyncError");
const AppError = require("../utils/appError");

const getPostByIdOrSlug = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  let query;
  if (mongoose.Types.ObjectId.isValid(id)) {
    query = Post.findById(id);
  } else {
    query = Post.findOne({ slug: id });
  }

  const post = await query.populate({
    path: "comment",
    populate: {
      path: "user",
      select: "fullName avatar",
    },
  });

  if (!post) return next(new AppError("Post not found", 404));

  // Increment view count
  post.views += 1;
  await post.save({ validateBeforeSave: false });

  res.status(200).json({
    status: "success",
    data: post,
  });
});

// TOGGLE DRAFT STATUS
const toggleDraftStatus = catchAsyncError(async (req, res, next) => {
  const post = await Post.findById(req.params.id);

  if (!post) return next(new AppError("Post not found", 404));
  if (!post.author.equals(req.user._id)) {
    return next(new AppError("You can only update your own posts", 403));
  }

  post.isDraft = !post.isDraft;
  await post.save();

  res.status(200).json({
    status: "success",
    message: `Post is now ${post.isDraft ? "in draft mode" : "published"}`,
  });
});

// TOGGLE LIKE
const toggleLike = catchAsyncError(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  if (!post) return next(new AppError("Post not found", 404));

  const userId = req.user._id;
  const alreadyLiked = post.likes.includes(userId);

  if (alreadyLiked) {
    post.likes.pull(userId);
  } else {
    post.likes.push(userId);
  }

  await post.save();

  res.status(200).json({
    status: "success",
    data: { liked: !alreadyLiked, totalLikes: post.likes.length },
  });
});

// TOGGLE BOOKMARK
const toggleBookmark = catchAsyncError(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  if (!post) return next(new AppError("Post not found", 404));

  const userId = req.user._id;
  const alreadyBookmarked = post.bookmarks.includes(userId);

  if (alreadyBookmarked) {
    post.bookmarks.pull(userId);
  } else {
    post.bookmarks.push(userId);
  }

  await post.save();

  res.status(200).json({
    status: "success",
    data: {
      bookmarked: !alreadyBookmarked,
      totalBookmarks: post.bookmarks.length,
    },
  });
});

const getMyDrafts = catchAsyncError(async (req, res, next) => {
  const drafts = await Post.find({
    author: req.user._id,
    isDraft: true,
    deleted: false,
  }).sort("-createdAt");

  res.status(200).json({
    status: "success",
    results: drafts.length,
    data: drafts,
  });
});

const getMyBookmarks = catchAsyncError(async (req, res, next) => {
  const bookmarks = await Post.find({
    bookmarks: req.user._id,
    isDraft: false,
    deleted: false,
  }).sort("-createdAt");

  res.status(200).json({
    status: "success",
    results: bookmarks.length,
    data: bookmarks,
  });
});

const createPost = factory.createOne(Post, { setUser: true });
const getAllPosts = factory.getAll(Post); // will exclude soft-deleted
const updatePost = factory.updateOne(Post);
const deletePost = factory.deleteOne(Post, { softDelete: true }); // 👈 soft delete!

module.exports = {
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
};
