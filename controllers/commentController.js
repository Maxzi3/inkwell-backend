const Comment = require("../models/commentModel");
const Post = require("../models/postModel");
const catchAsyncError = require("../utils/catchAsyncError");
const AppError = require("../utils/appError");

// Create comment or reply
const createComment = catchAsyncError(async (req, res, next) => {
  const { postId } = req.params;
  const { content, parent } = req.body;

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

  const comments = await Comment.find({ post: postId, parent: null })
    .populate("user", "fullName avatar")
    .populate({
      path: "replies",
      populate: { path: "user", select: "fullName avatar" },
    })
    .sort("-createdAt");

  res.status(200).json({
    status: "success",
    results: comments.length,
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
