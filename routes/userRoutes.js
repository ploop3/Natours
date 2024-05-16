const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

/**
 * Routes
 * authController.protect will add the logged user to the request object
 */

const router = express.Router();

//These routes do not require authentication
//TODO: /login should be accessed only if there's no user logged in
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

//All routes after this point require authentication
//So we can use the middleware directly in the router since they run in sequence
router.use(authController.protect);

router.patch('/updateMyPassword', authController.updatePassword);
router.get('/me', userController.getMe, userController.getUser);
router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe,
);
router.delete('/deleteMe', userController.deleteMe);

//All routes after this point not only require authentication but also are restricted to admins
router.use(authController.restrictTo('admin'));
router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
