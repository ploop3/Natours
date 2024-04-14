const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handleFactory');

/**
 *
 * @param {*} obj = the req.body with all properties that come from the end user
 * @param  {...any} allowedFields are the only ones that the user can modify from the DB
 * Otherwise, without filtering, they could assign themselves a new role
 * @returns The filtered object with the properties to update the DB
 */
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((element) => {
    if (allowedFields.includes(element)) {
      newObj[element] = obj[element];
    }
  });
  return newObj;
};

/**
 * Route handlers
 */

//Update only your own name and email address
exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error is user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword',
        400,
      ),
    );
  }

  // 2) Filtered out unwanted field names that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');

  // 3) Update user document
  //This time we can't use findByIdAndUpdate because we don't need to compare password and
  // passwordConfirm, since we are dealing with not sensitive data

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

/**
 * Delete your own account.
 * We don't really delete it from DB, oly change the property active = false
 */
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use /signup instead',
  });
};

//Only for admins, and to update data that's not the password (email, name, role)
exports.updateUser = factory.updateOne(User);

exports.getUser = factory.getOne(User);
exports.getAllUsers = factory.getAll(User);
exports.deleteUser = factory.deleteOne(User);
