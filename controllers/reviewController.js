const Review = require('../models/reviewModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handleFactory');

exports.getReview = catchAsync(async (req, res, next) => {
  console.log('ID:', req.params.id);
  const review = await Review.findById(req.params.id);
  if (!review) {
    return next(new AppError('No review found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      review,
    },
  });
});

exports.getAllReviews = catchAsync(async (req, res, next) => {
  //If the url contains the tourID, then show all reviews that belong to that
  let filter = {};
  if (req.params.tourId) filter = { tour: req.params.tourId };

  const reviews = await Review.find(filter);

  //Send response
  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews,
    },
  });
});

exports.setTourUserIds = (req, res, next) => {
  //Allow nested routes in case the user does not provide user and tour in the body.
  //We get them from the URL and the logged user(protect middleware)
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;

  req.body = {
    review: req.body.review,
    rating: req.body.rating,
    tour: req.body.tour,
    user: req.body.user,
  };
  next();
};

exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
