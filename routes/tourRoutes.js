const express = require('express');
const tourController = require('../controllers/tourContoller');
const authController = require('../controllers/authController');
const reviewRouter = require('./../routes/reviewRoutes');

/**
 * Routes
 */

const router = express.Router();

/**
 * Nested Routes
 */

//If we encounter this route, use the reviewRouter instead
//The app.js redirect them here, because of the /tours/, but we are now redirecting them to reviewRouter
router.use('/:tourId/reviews', reviewRouter);

// router.param('id', tourController.checkID);

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);

router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan,
  );

// Route using query string: /tours-within&distance=300&center-40,45&unit=mi
//Toute using query params: /tours-within/233/center/-40,45/unit/mi
router
  .route('/tours-within/:distance/center/:latlng/unit:unit')
  .get(tourController.getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

//getAll tours is open for everyone
//Creating, editing and deleting a tour is restricted
router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.sanitizeTourBody,
    tourController.createTour,
  );

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour,
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour,
  );

module.exports = router;
