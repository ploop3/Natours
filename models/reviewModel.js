const mongoose = require('mongoose');
const Tour = require('./tourModel');

//review / rating / createdAt / reference to tour  / ref to user

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be empty!'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 4.5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour.'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to an user.'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

/**
 * Index
 * To prevent duplicated reviews from a single user
 * An user can only create one review per tour
 */
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

/**
 * QUERY MIDDLEWARES
 */
reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  // this.populate({
  //   path: 'tour',
  //   select: 'name',
  // });
  next();
});

/**
 * STATIC Methods
 *
 * Using static method because we needed to call this.aggregate()
 * In static methods, 'this' points to the model/schema
 *
 * 1. This method will get all the reviews that belong to a tour and calculate
 *    the rating average using Aggregation pipelines (steps)
 *
 * 2. Then will update that value into the Tour document the reviews belong to
 */

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        numRatings: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].numRatings,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5, //Default rating
    });
  }
};

//3. We will then call this method each time a new review is created using a middleware .post('save')

reviewSchema.post('save', function () {
  this.constructor.calcAverageRatings(this.tour);
});

/**
 * 4. We should do the same actions when we UPDATE and DELETE a review:
 * findByIdAndUpdate
 * findByIdAndDelete
 *
 * Those queries run after the document(review) has been created, so we can only use Query Middlewares where 'this' points to the query.
 *
 * In the controller we use 'findByIdAndUpdate', but in the background it runs 'findOneAndUpdate' or ...delete
 */

//4.1 Before running the query we extract the Document and save it in 'this' (Query object)
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.model.findOne(this.getQuery());
  next();
});

//4.2 After the query has finished (post), we now push the new data to the Tour
reviewSchema.post(/^findOneAnd/, async function () {
  //this.r is the current Document, not the query
  //If not found, it will be null
  if (this.r !== null) {
    await this.r.constructor.calcAverageRatings(this.r.tour);
  }
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
