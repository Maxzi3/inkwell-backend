const APIFeatures = require("../utils/apiFeatures");
const catchAsyncError = require("../utils/catchAsyncError");
const AppError = require("../utils/appError");


const deleteOne = (Model, { softDelete = false } = {}) =>
  catchAsyncError(async (req, res, next) => {
    const doc = await Model.findById(req.params.id);

    if (!doc) return next(new AppError("No document found with that ID", 404));

    // Check if the user is allowed to delete
    if (doc.author.toString() !== req.user.id && req.user.role !== "admin") {
      return next(
        new AppError("You are not allowed to delete this document", 403)
      );
    }

    if (softDelete) {
      await Model.findByIdAndUpdate(req.params.id, { deleted: true });
    } else {
      await Model.findByIdAndDelete(req.params.id);
    }

    res.status(200).json({
      status: "success",
      message: "Data deleted successfully",
    });
  });

  const updateOne = (Model) =>
    catchAsyncError(async (req, res, next) => {
      const doc = await Model.findById(req.params.id);

      if (!doc)
        return next(new AppError("No document found with that ID", 404));

      // Check if the user is allowed to update
      if (doc.author.toString() !== req.user.id && req.user.role !== "admin") {
        return next(
          new AppError("You are not allowed to update this document", 403)
        );
      }

      // Now update it
      const updatedDoc = await Model.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
          runValidators: true,
        }
      );

      res.status(200).json({
        status: "success",
        data: {
          data: updatedDoc,
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


  const getAll = (
    Model,
    { filterDeleted = true, populateOptions = null } = {}
  ) =>
    catchAsyncError(async (req, res, next) => {
      let filter = {};

      if (filterDeleted) {
        filter.deleted = { $ne: true };
      }

      if (req.query.post) {
        filter.post = req.query.post;
      }

      if (Model.modelName === "Post" && !req.user?.role?.includes("admin")) {
        filter.isDraft = false;
      }

      // Apply all query features (filter, search, pagination, etc.)
      let query = Model.find(filter);
      if (populateOptions) {
        query = query.populate(populateOptions);
      }

      const features = new APIFeatures(query, req.query)
        .filter()
        .search(["title", "content"])
        .sort()
        .limitFields()
        .paginate();

      const data = await features.query;

      //  Generate another query to count total WITH search + filter
      let countQuery = Model.find(filter);

      const countFeatures = new APIFeatures(countQuery, req.query)
        .filter()
        .search(["title", "content"]);

      const totalFiltered = await countFeatures.query.countDocuments();

      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;

      res.status(200).json({
        status: "success",
        results: data.length,
        currentPage: page,
        totalPages: Math.ceil(totalFiltered / limit),
        totalResults: totalFiltered,
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
