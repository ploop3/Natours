const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handleFactory');

/**
 * Route handlers
 */

//Middleware for the top 5 best cheapest tours
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
    // {
    //   $match: { _id: { $ne: 'EASY' } },
    // },
  ]);

  res.status(200).json({
    status: 'success',
    data: stats,
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; //convert it to number
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        //Filter by year, if 2021, then >= 1.1.2021 and <= 31.12.2022
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      //Create groups of documents where the month is the same
      //Count how many per group (numTourStars)
      //Add the name of every match to an array called tours
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      //Used to rename a property (clone it and hide the old _id)
      $addFields: { month: '$_id' },
    },
    {
      //We hide the _id
      $project: {
        _id: 0,
      },
    },
    {
      //Sort by amount of tours, descending(-1)
      $sort: { numTourStarts: -1 },
    },
    {
      //Allow a max of 6 ouputs/groups
      $limit: 6,
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
});

exports.sanitizeTourBody = (req, res, next) => {
  req.body = {
    name: req.body.name,
    duration: req.body.duration,
    maxGroupSize: req.body.maxGroupSize,
    difficulty: req.body.difficulty,
    ratingsAverage: req.body.ratingsAverage,
    ratingsQuantity: req.body.ratingsQuantity,
    price: req.body.price,
    summary: req.body.summary,
    imageCover: req.body.imageCover,
    images: req.body.images,
    startDates: req.body.startDates,
    startLocation: req.body.startLocation,
    guides: req.body.guides,
    locations: req.body.locations,
  };
  next();
};

exports.createTour = factory.createOne(Tour);

exports.getAllTours = factory.getAll(Tour);

exports.getTour = factory.getOne(Tour, { path: 'reviews' });

exports.updateTour = factory.updateOne(Tour);

exports.deleteTour = factory.deleteOne(Tour);

/**
 * The goal is to get find available tours within a distance radius
 * The user will provide the starting point, the radius and units(km, mi)
 *
 * Example of requests:
 * /tours-within/:distance/center/:latlng/unit:unit
 * /tours-within/200/center/34.111745,-118.113491/unit:mi
 */
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  //Mongo db requires the radius pass in units called radiants
  // radiants = distance / radius of the hearth
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitud and longitude in the format lat,lng',
        400,
      ),
    );
  }

  //GeoSpacial queries
  //$centerSphere takes an array with the coordinates and the radius
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

//Calculate the distance from an specific point to the tours
exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  //handle miles vs kms
  //Google: 1 meter in miles = 0.0006213712
  const multiplier = unit === 'mi' ? 0.0006213712 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitud and longitude in the format lat,lng',
        400,
      ),
    );
  }

  //Will return the distances from 'near' to the 'startingPoint' Index of all tours
  //The 'distance' field will be added to the tour, which will contain the distance between the point given ('near') to this tour
  //The result will be given in meters
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [Number(lng), Number(lat)],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier, //To convert meters to KMs or Miles
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});
