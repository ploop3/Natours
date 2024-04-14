const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

//Thanks to mereParams:true, this router will now handle these routes:
// POST /tour/idTourxxx/reviews
// GET /tour/idTourxxx/reviews  --Get All Reviews from that tourID
// POST /reviews

//Only 'user' users can create reviews, no 'admin' nor 'guide'
router
  .route('/')
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview,
  )
  .get(reviewController.getAllReviews);

router
  .route('/:id')
  .get(reviewController.getReview)
  .delete(
    authController.protect,
    authController.restrictTo('admin'),
    reviewController.deleteReview,
  )
  .patch(authController.protect, reviewController.updateReview);

module.exports = router;
