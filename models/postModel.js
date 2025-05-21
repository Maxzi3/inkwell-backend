const mongoose = require("mongoose");
const slugify = require("slugify");

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "A post must have a title"],
  },
  slug: String,
  content: {
    type: String,
    required: [true, "A post must have content"],
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  comment: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
  isDraft: { type: Boolean, default: false },
  views: { type: Number, default: 0 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  deleted: {
    type: Boolean,
    default: false,
  },
});

// Middleware to create slug before saving
postSchema.pre("save", function (next) {
  if (!this.isModified("title")) return next();
  this.slug = slugify(this.title, { lower: true });
  next();
});
module.exports = mongoose.model("Post", postSchema);
