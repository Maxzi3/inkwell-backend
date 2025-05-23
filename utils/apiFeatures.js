class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }
  filter() {
    const queryObj = { ...this.queryString };
    const exclude = ["page", "limit", "sort", "fields"];
    exclude.forEach((param) => delete queryObj[param]);

    // 1B) ADVANCED FILTERING
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

    // Ensure valid page and limit
    page = page > 0 ? page : 1;
    limit = limit > 0 ? limit : 100;

    const startIndex = (page - 1) * limit;
    this.query = this.query.skip(startIndex).limit(limit);
    return this;
  }
  search(fields = []) {
    if (this.queryString.search) {
      const keyword = this.queryString.search.trim();

      // Create a regex condition for each searchable field
      const searchConditions = fields.map((field) => ({
        [field]: { $regex: keyword, $options: "i" }, // case-insensitive
      }));

      this.query = this.query.find({ $or: searchConditions });
    }
    return this;
  }
}
module.exports = APIFeatures;
