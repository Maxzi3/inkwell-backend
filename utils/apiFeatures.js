class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const exclude = ["page", "limit", "sort", "fields", "search"];
    exclude.forEach((param) => delete queryObj[param]);

    
    Object.keys(queryObj).forEach((key) => {
      if (
        queryObj[key] === "" ||
        queryObj[key] === "undefined" ||
        queryObj[key] === null
      ) {
        delete queryObj[key];
      }

      // remove default filters like "All"
      if (queryObj[key] === "All") {
        delete queryObj[key];
      }
    });

    // Advanced filtering (gte, gt, lte, lt)
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(
      /\b(gte|gt|lte|lt)\b/g,
      (match) => `$${match.toLowerCase()}`
    );

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("-createdAt");
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").join(" ");
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v");
    }
    return this;
  }

  paginate() {
    let page = parseInt(this.queryString.page, 10);
    let limit = parseInt(this.queryString.limit, 10);

    page = page > 0 ? page : 1;
    limit = limit > 0 ? limit : 100;

    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }

  search(fields = []) {
    const keyword = this.queryString.search?.trim();

    if (keyword && keyword !== "" && keyword !== "undefined") {
      const searchConditions = fields.map((field) => ({
        [field]: { $regex: keyword, $options: "i" },
      }));

      this.query = this.query.find({ $or: searchConditions });
    }

    return this;
  }
}
module.exports = APIFeatures;