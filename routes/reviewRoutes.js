const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

//Thanks to mereParams:true, this router will now handle these routes:
// POST /tour/idTourxxx/reviews
// GET /tour/idTourxxx/reviews  --Get All Reviews from that tourID
// POST /reviews

//Authentication: All actions related to reviews must be protected
router.use(authController.protect);

//Authorization: Only 'user' users can create reviews, no 'admin' nor 'guide'
//Only 'user' and 'admin' can delete or update reviews
router
  .route('/')
  .post(
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview,
  )
  .get(reviewController.getAllReviews);

router
  .route('/:id')
  .get(reviewController.getReview)
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview,
  )
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview,
  );

module.exports = router;
