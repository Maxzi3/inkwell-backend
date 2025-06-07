const Comment = require("../models/commentModel");
const Post = require("../models/postModel");
const Notification = require("../models/notificationModel");
const catchAsyncError = require("../utils/catchAsyncError");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/apiFeatures");

// Create comment or reply
const createComment = catchAsyncError(async (req, res, next) => {
  const { postId } = req.params;
  const { content, parent } = req.body;

  const post = await Post.findById(postId);

  // Notify post author (avoid notifying self)
  if (post.author.toString() !== req.user._id.toString()) {
    await Notification.create({
      recipient: post.author,
      sender: req.user._id,
      type: "comment",
      post: postId,
      comment: Comment._id,
    });
  }

  const newComment = await Comment.create({
    content,
    post: postId,
    user: req.user._id,
    parent: parent || null, // parent is optional
  });

  res.status(201).json({
    status: "success",
    data: newComment,
  });
});

// Get all top-level comments for a post, including replies
const getCommentsForPost = catchAsyncError(async (req, res, next) => {
  const { postId } = req.params;

  // Initial query: get top-level comments only
  const initialQuery = Comment.find({ post: postId, parent: null });

  // Apply APIFeatures to support pagination, sorting, etc.
  const features = new APIFeatures(initialQuery, req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  // Execute the query
  const comments = await features.query
    .populate("user", "fullName avatar")
    .populate({
      path: "replies",
      populate: { path: "user", select: "fullName avatar" },
    });

  // Get total count of top-level comments for metadata
  const total = await Comment.countDocuments({ post: postId, parent: null });

  res.status(200).json({
    status: "success",
    results: comments.length,
    total,
    currentPage: parseInt(req.query.page, 10) || 1,
    totalPages: Math.ceil(total / (parseInt(req.query.limit, 10) || 100)),
    data: comments,
  });
});


// Update comment or reply
const updateComment = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { content } = req.body;

  if (!content) return next(new AppError("Content is required", 400));

  const comment = await Comment.findById(id);

  if (!comment) return next(new AppError("Comment not found", 404));

  // Only owner can edit
  if (comment.user.toString() !== req.user._id.toString()) {
    return next(new AppError("You can only edit your own comments", 403));
  }

  comment.content = content;
  await comment.save();

  res.status(200).json({
    status: "success",
    message: "Comment updated successfully",
    data: comment,
  });
});

// Delete Comment or Reply
const deleteComment = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const comment = await Comment.findById(id);
  if (!comment) return next(new AppError("Comment not found", 404));

  const post = await Post.findById(comment.post);
  if (!post) return next(new AppError("Post not found", 404));

  const isCommentOwner = comment.user.toString() === req.user._id.toString();
  const isPostAuthor = post.author.toString() === req.user._id.toString();

  if (!isCommentOwner && !isPostAuthor) {
    return next(
      new AppError("You are not allowed to delete this comment", 403)
    );
  }

  // Delete the comment and all its direct replies
  await Comment.deleteMany({
    $or: [{ _id: comment._id }, { parent: comment._id }],
  });

  res.status(200).json({
    status: "success",
    message: "Comment and its replies deleted",
  });
});

module.exports = {
  createComment,
  getCommentsForPost,
  updateComment,
  deleteComment,
};
