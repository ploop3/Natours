const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createAndSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);

  //Expires in X Days converted to milliseconds
  //httpOnly = the cookie cannot be accessed/modified by the broser (only server) -cross XSS
  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  });

  //Remove password from the output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    // passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });
  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();

  createAndSendToken(newUser, 201, req, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //1) Check if email and password exists
  if (!email || !password) {
    next(new AppError('Please provide an email and password', 400));
  }
  //2) Check if user exists and password is correct
  const user = await User.findOne({ email: email }).select('+password');
  //correctPassword is an instance method I added that is available to all users

  // const correct = await user.correctPassword(password, user.password);
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  //3) If everything ok, send token to client
  createAndSendToken(user, 200, req, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

/**
 * Used in all routes that require authentication
 * It will do this check every time you access
 */
exports.protect = catchAsync(async (req, res, next) => {
  //1) Get the token and check if it exists

  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else {
    //Get the token from the client cookie
    if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access', 401),
    );
  }

  //2) Verification token
  const payload = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3) Check if the user still exists
  //- In case the user has been deleted in the meantime
  //- In case someone stole the token and the real user changed the password
  const freshUser = await User.findById(payload.id);

  if (!freshUser) {
    return next(
      new AppError('The user this token belongs to does not exist.', 401),
    );
  }

  //4) Check if the user changed password after the token was issued
  if (freshUser.changedPasswordAfter(payload.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401),
    );
  }

  //GRANT Access to Protected Route
  //We create a new property 'user' in the req object and the next middleware will receive this
  //modified request object
  req.user = freshUser;

  //In our middlewares, we can use `.locals` to add variables
  //that will be accesible by our pug templates.
  res.locals.user = freshUser;
  next();
});

/**
 * Only for rendered pages(frontend), no error
 * We don't need to globally capture any logs (removed catchAsync), only locally
 */

exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      //1) Verification token
      const payload = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET,
      );

      //2) Check if the user still exists
      const freshUser = await User.findById(payload.id);

      if (!freshUser) {
        return next();
      }

      //3) Check if the user changed password after the token was issued
      if (freshUser.changedPasswordAfter(payload.iat)) {
        return next();
      }

      //There is a logged in user
      res.locals.user = freshUser;
      return next();
    } catch (error) {
      //JWT token contained in the cookie is not valid
      return next();
    }
  }
  next();
};

/**
 * The middlewares do not accept arguments(must be req, res, next) but we need to pass the
 * roles
 * The solution is to create an annonymous wrapper function that will return the middleware function
 *
 * roles is an array: ['admin', 'lead-guide']
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //req.user is created by the protect middleware, which always runs before restrictTo
    //as per the order in the routes
    if (!roles.includes(req.user.role)) {
      //503 is the specific HTTP for these authorization isseeues
      return next(
        new AppError('You do not have permission to perform this action', 403),
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address', 404));
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  //To actually upload the modified data to the db
  await user.save({ validateBeforeSave: false });

  try {
    // 3) Send it to user's email
    const resetURL = `${req.protocol}://${req.get(
      'host',
    )}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError(error), 500);
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on token
  //The token is passed in the query params(url)
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  //Find the user that meeds both conditions:
  //contains that token, and the expiration date is greater than now(valid)
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) It token has not expires, and there's user, set new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  //We pass the new password in the body(raw JSON)
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  // 3) Update changePasswordAt property for the user
  //Modified the userModel.js -> userSchema.pre('save'...

  // 4) Log the user in, send new JWT
  createAndSendToken(user, 200, req, res);
});

/**
 * router.post('/updatePassword',authController.protect, authController.updatePassword);
 *
 * It has to pass through protect middleware, meaning that the user must provide a valid token
 * to verified he is logged in.
 * If valid, the protect middleware will add a new property to the request object "req.user"
 */

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get the user from collection based on the current logged user (token)
  //It passes through the middleware protect, which creates req.user property
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    next(new AppError('Current password is wrong', 401));
  }

  // 3) If yes, update password with the newPOSTed passwords
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.newPasswordConfirm;

  await user.save();
  //User.findByIdAndUpdate()

  // 4) Log user in and asend JWT
  createAndSendToken(user, 200, req, res);
});
