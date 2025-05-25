const mongoose = require("mongoose");
const slugify = require("slugify");

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "A post must have a title"],
    },
    slug: String,
    category: { type: String, required: true, set: (val) => val.toLowerCase() },
    image: {
      type: String,
    },
    content: {
      type: String,
      required: [true, "A post must have content"],
    },
    author: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    isDraft: { type: Boolean, default: false, select: false },
    views: { type: Number, default: 0 },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    deleted: {
      type: Boolean,
      default: false,
      select: false,
    },
  },
  { timestamps: true }
);

// Middleware to create slug before saving
postSchema.pre("save", function (next) {
  if (!this.isModified("title")) return next();
  this.slug = slugify(this.title, { lower: true });
  next();
});

// Virtual populate for comment
postSchema.virtual("comments", {
  ref: "Comment",
  foreignField: "post",
  localField: "_id",
});

postSchema.set("toObject", { virtuals: true });
postSchema.set("toJSON", { virtuals: true });
module.exports = mongoose.model("Post", postSchema);


