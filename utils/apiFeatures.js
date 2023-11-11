class APIFeatures {
  constructor(mongooseQuery, routeQueryString) {
    this.mongooseQuery = mongooseQuery;
    this.routeQueryString = routeQueryString;
  }

  filter() {
    /**
     *  Build the query
     * 1) Filtering
     */
    const queryObj = { ...this.routeQueryString }; //Shallow copy
    const excludeFields = ['page', 'sort', 'limit', 'fields'];
    excludeFields.forEach((el) => delete queryObj[el]);

    /**
     *    1b) Advanced filtering
     * HTTP request: localhost:3000/api/v1/tours?duration[gte]=5&difficulty=easy
     * req.query : `{difficulty: 'easy', duration: { gte: '5'}}`
     * MongoDB filter object: `{difficulty: 'easy', duration: { $gte: '5'}}`
     */

    let queryStr = JSON.stringify(queryObj);
    //Add the '$' before each operator
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    // let query = Tour.find(JSON.parse(queryStr));
    this.mongooseQuery = this.mongooseQuery.find(JSON.parse(queryStr));

    return this;
  }

  /**
   * 2) Sorting
   * GET http://localhost:3000/api/v1/tours?sort=price,createdAt
   */
  sort() {
    if (this.routeQueryString.sort) {
      const sortBy = this.routeQueryString.sort.split(',').join(' ');
      this.mongooseQuery = this.mongooseQuery.sort(sortBy);
    } else {
      //Default sort - Newest first
      this.mongooseQuery = this.mongooseQuery.sort('-createdAt');
    }

    return this;
  }

  /**
   * 3) Field limit
   * Allow the API user to request some of the fields
   * GET http://localhost:3000/api/v1/tours?fields=name,duration,difficulty,price
   */
  limitFields() {
    if (this.routeQueryString.fields) {
      const fields = this.routeQueryString.fields.split(',').join(' ');
      this.mongooseQuery = this.mongooseQuery.select(fields);
      // this.mongooseQuery = this.mongooseQuery.select('name duration')
    } else {
      this.mongooseQuery = this.mongooseQuery.select('-__v'); //We use a minus to exclude the field "__v"
    }

    return this;
  }

  /**
   * 4) Pagination
   *  page=3&limit=10
   * results 1-10 in page 1, 11-20 in page 2, 21-30 in page 3
   * query.skip(20).limit(10)
   */

  paginate() {
    const page = this.routeQueryString.page * 1 || 1; //default value
    const limit = this.routeQueryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    this.mongooseQuery = this.mongooseQuery.skip(skip).limit(limit);

    //check if the user a page but no results exist
    // if (this.routeQueryString.page) {
    //   const numTours = await Tour.countDocuments();
    //   if (skip >= numTours) throw new Error('This page does not exist');
    // }

    return this;
  }
}

module.exports = APIFeatures;
