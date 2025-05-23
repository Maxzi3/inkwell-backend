const APIFeatures = require("../utils/apiFeatures");
const catchAsyncError = require("../utils/catchAsyncError");
const AppError = require("../utils/appError");

const deleteOne = (Model, { softDelete = false } = {}) =>
  catchAsyncError(async (req, res, next) => {
    let doc;

    if (softDelete) {
      doc = await Model.findByIdAndUpdate(req.params.id, { deleted: true });
    } else {
      doc = await Model.findByIdAndDelete(req.params.id);
    }

    if (!doc) return next(new AppError("No document found with that ID", 404));

    res.status(200).json({
      status: "success",
      message: "Data deleted successfully",
    });
  });

const updateOne = (Model) =>
  catchAsyncError(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) return next(new AppError("No document found with that ID", 404));

    res.status(200).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });

const createOne = (Model, { setUser = false } = {}) =>
  catchAsyncError(async (req, res, next) => {
    if (setUser && req.user) {
      req.body.author = req.user._id;
    }

    const doc = await Model.create(req.body);

    res.status(201).json({ status: "success", data: doc });
  });

const getOne = (Model, popOptions) =>
  catchAsyncError(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;

    if (!doc) return next(new AppError("No document found with that ID", 404));

    res.status(200).json({
      status: "success",
      data: { doc },
    });
  });

const getAll = (Model, { filterDeleted = true } = {}) =>
  catchAsyncError(async (req, res, next) => {
    let filter = {};

    // Exclude soft-deleted documents
    if (filterDeleted) {
      filter.deleted = { $ne: true };
    }

    // If filtering by post ID (e.g., for comments)
    if (req.query.post) {
      filter.post = req.query.post;
    }

    // Only return public posts for non-admin users
    if (Model.modelName === "Post" && !req.user?.role?.includes("admin")) {
      filter.isDraft = false;
    }

    // Apply query features (filter, sort, paginate, etc.)
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .search(["title", "content"])
      .sort()
      .limitFields()
      .paginate();

    const data = await features.query;

    // Count total based on the same filter
    const total = await Model.countDocuments(filter);

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 100;

    res.status(200).json({
      status: "success",
      results: data.length,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalResults: total,
      data,
    });
  });

module.exports = {
  deleteOne,
  updateOne,
  createOne,
  getOne,
  getAll,
};
