const mongoose = require("mongoose");
const multer = require("multer");
const { resizeImage, uploadToCloudinary } = require("../utils/cloudinary");
const Post = require("../models/postModel");
const Notification = require("../models/notificationModel");
const factory = require("./factoryController");
const catchAsyncError = require("../utils/catchAsyncError");
const AppError = require("../utils/appError");

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

const storage = multer.memoryStorage();
const upload = multer({ storage });
const uploadPostImage = upload.single("image");

const getPostByIdOrSlug = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  let query;
  if (mongoose.Types.ObjectId.isValid(id)) {
    query = Post.findById(id);
  } else {
    query = Post.findOne({ slug: id });
  }

  const post = await query.populate([
    {
      path: "comments",
      match: { parent: null },
      populate: [
        {
          path: "user",
          select: "fullName avatar",
        },
        {
          path: "replies",
          populate: {
            path: "user",
            select: "fullName avatar",
          },
        },
      ],
    },
    {
      path: "author",
      select: "fullName avatar",
    },
  ]);

  if (!post) return next(new AppError("Post not found", 404));

  // Increment view count
  post.views += 1;
  await post.save({ validateBeforeSave: false });

  res.status(200).json({
    status: "success",
    data: post,
  });
});

// TOGGLE DRAFT
const saveAsDraft = catchAsyncError(async (req, res, next) => {
  const { title, content, category } = req.body;

  if (!title && !content) {
    return next(
      new AppError("Draft must have at least a title or content", 400)
    );
  }

  let image;
  if (req.file) {
    const resizedBuffer = await resizeImage(req.file.buffer);
    const uploadResult = await uploadToCloudinary(
      resizedBuffer,
      `draft-cover-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      "drafts"
    );
    image = uploadResult.secure_url;
  }

  const draftpost = await Post.create({
    title,
    content,
    category,
    author: req.user._id,
    isDraft: true,
    image,
  });

  res.status(201).json({
    status: "success",
    data: draftpost,
  });
});

// Publish draft
const publishDraft = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  // Find the post first
  const post = await Post.findOne({
    _id: id,
    author: req.user._id,
    isDraft: true, // make sure it's currently a draft
  });

  if (!post) {
    return next(new AppError("Draft not found or already published", 404));
  }

  // Update draft status
  post.isDraft = false;
  post.createdAt = new Date();
  await post.save();

  res.status(200).json({
    status: "success",
    message: "Post has been published.",
    post,
  });
});

const deleteDraft = catchAsyncError(async (req, res, next) => {
  const draftId = req.params.id;
  const userId = req.user.id;

  const draft = await Post.findOne({ _id: draftId, author: userId });

  if (!draft) {
    return next(new AppError("Draft not found", 404));
  }

  if (draft.isDraft === false) {
    return next(new AppError("Cannot delete published post", 403));
  }

  await draft.deleteOne();

  res.status(204).json({
    status: "success",
    message: "Draft deleted successfully",
  });
});

// TOGGLE LIKE
const likePost = async (req, res) => {
  const post = await Post.findById(req.params.id);
  const userId = req.user._id;

  if (!post.likes.includes(userId)) {
    post.likes.push(userId);

    // Optional: Create notification
    if (post.author.toString() !== userId.toString()) {
      await Notification.create({
        recipient: post.author,
        sender: userId,
        type: "like",
        post: post._id,
      });
    }

    await post.save();
  }

  res.status(200).json({ message: "Liked", likes: post.likes.length });
};

const unlikePost = async (req, res) => {
  const post = await Post.findById(req.params.id);
  const userId = req.user._id;

  post.likes.pull(userId);
  await post.save();

  res.status(200).json({ message: "Unliked", likes: post.likes.length });
};

// TOGGLE BOOKMARK
const bookmarkPost = async (req, res) => {
  const post = await Post.findById(req.params.id);
  const userId = req.user._id;

  if (!post.bookmarks.includes(userId)) {
    post.bookmarks.push(userId);
    await post.save();
  }

  res
    .status(200)
    .json({ message: "Bookmarked", bookmarks: post.bookmarks.length });
};

const unbookmarkPost = async (req, res) => {
  const post = await Post.findById(req.params.id);
  const userId = req.user._id;

  post.bookmarks.pull(userId);
  await post.save();

  res
    .status(200)
    .json({ message: "Unbookmarked", bookmarks: post.bookmarks.length });
};

const getUserPosts = catchAsyncError(async (req, res, next) => {
  const posts = await Post.find({
    author: req.user._id,
    isDraft: false,
    deleted: false,
  })
    .populate("author", "fullName avatar")
    .sort("-createdAt");

  res.status(200).json({
    status: "success",
    results: posts.length,
    data: posts,
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

const getMyLikes = catchAsyncError(async (req, res, next) => {
  const likes = await Post.find({
    likes: req.user._id,
    isDraft: false,
    deleted: false,
  })
    .sort("-createdAt")
    .populate("author", "fullName avatar");

  res.status(200).json({
    status: "success",
    results: likes.length,
    data: likes,
  });
});

const getMyBookmarks = catchAsyncError(async (req, res, next) => {
  const bookmarks = await Post.find({
    bookmarks: req.user._id,
    isDraft: false,
    deleted: false,
  })
    .sort("-createdAt")
    .populate({ path: "author", select: "fullName avatar" });

  res.status(200).json({
    status: "success",
    results: bookmarks.length,
    data: bookmarks,
  });
});

const createPost = catchAsyncError(async (req, res, next) => {
  // 1. Filter allowed fields
  const filteredBody = filterObj(req.body, "title", "content", "category");

  // 2. Set the author of the post
  filteredBody.author = req.user._id;

  // 3. Handle image uploads
  if (req.file) {
    const resizedBuffer = await resizeImage(req.file.buffer);
    const uploadResult = await uploadToCloudinary(
      resizedBuffer,
      `post-cover-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      "posts"
    );
    filteredBody.image = uploadResult.secure_url;
  }

  // 4. Save the post
  const newPost = await Post.create(filteredBody);

  // 5. Send response
  res.status(201).json({
    status: "success",
    data: newPost,
  });
});

const updatePost = catchAsyncError(async (req, res, next) => {
  // Filter allowed fields
  const filteredBody = filterObj(req.body, "title", "content", "category");

  // Handle image uploads
  if (req.file) {
    const resizedBuffer = await resizeImage(req.file.buffer);
    const uploadResult = await uploadToCloudinary(
      resizedBuffer,
      `post-cover-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      "posts"
    );
    filteredBody.image = uploadResult.secure_url;
  }

  // Update post
  const updatedPost = await Post.findByIdAndUpdate(
    req.params.id,
    filteredBody,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedPost) {
    return next(new AppError("Post not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { updatedPost },
  });
});

const editDraft = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  // 1. Find the post and ensure it's a draft
  const draft = await Post.findOne({ _id: id, isDraft: true });

  if (!draft) {
    return next(new AppError("Draft not found or already published", 404));
  }

  // 2. Ensure only the owner can edit
  if (draft.author.toString() !== req.user.id) {
    return next(new AppError("You are not allowed to edit this draft", 403));
  }

  // 3. Filter only allowed fields
  const filteredBody = filterObj(req.body, "title", "content", "category");

  // 4. Handle image upload
  if (req.file) {
    const resizedBuffer = await resizeImage(req.file.buffer);
    const uploadResult = await uploadToCloudinary(
      resizedBuffer,
      `post-cover-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      "posts"
    );
    filteredBody.image = uploadResult.secure_url;
  }

  // 5. Apply updates to the draft and save
  Object.assign(draft, filteredBody);
  await draft.save();

  res.status(200).json({
    status: "success",
    message: "Draft updated successfully",
    data: draft,
  });
});

// const createPost = factory.createOne(Post, { setUser: true });
const getAllPosts = factory.getAll(Post, {
  populateOptions: {
    path: "author",
    select: "fullName avatar",
  },
}); // will exclude soft-deleted
const deletePost = factory.deleteOne(Post, { softDelete: true }); // 👈 soft delete!

module.exports = {
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
};
