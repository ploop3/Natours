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
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

router
  .route('/')
  .get(authController.protect, tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('guide', 'admin'),
    tourController.sanitizeTourBody,
    tourController.createTour,
  );

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour,
  );

module.exports = router;
