const mongoose = require("mongoose");
const slugify = require("slugify");

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: function () {
        return !this.isDraft;
      },
    },
    slug: String,
    category: {
      type: String,
      required: function () {
        return !this.isDraft;
      },
      set: (val) => val.toLowerCase(),
    },
    image: String,
    content: {
      type: String,
      required: function () {
        return !this.isDraft;
      },
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
postSchema.post("save", async function (doc, next) {
  if (!doc.slug) {
    const generatedSlug =
      slugify(doc.title, { lower: true, strict: true }) + `-${doc._id}`;
    await mongoose.models.Post.findByIdAndUpdate(doc._id, {
      slug: generatedSlug,
    });
  }
  next();
});

// Virtual populate for comments
postSchema.virtual("comments", {
  ref: "Comment",
  foreignField: "post",
  localField: "_id",
});

// Virtual field for like count
postSchema.virtual("likesCount").get(function () {
  return this.likes?.length || 0;
});

// Enable virtuals in JSON and Object responses
postSchema.set("toObject", { virtuals: true });
postSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Post", postSchema);
