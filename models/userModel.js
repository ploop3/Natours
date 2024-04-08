const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Provide a valid email'],
  },
  photo: String,
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minLength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      //This only works on CREATE and SAVE!! (cannot use moongoose .findOneAndUpdate)
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not the same',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false, //to show it in the user properties only if explicitly requested +active
  },
});

/**
 * Encrypt the password
 *
 *  .pre() means that it happens between the moment we receive the data and the moment when it is 'saved' in the DB
 */

userSchema.pre('save', async function (next) {
  //Only run if password was modified
  //this = the current document/user
  if (!this.isModified('password')) return next();

  //Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  //remove from the database since we won't need it anymore
  this.passwordConfirm = undefined;
  next();
});

//If we modify the password, it will automatically modify the property "passwordChangedAt"
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  //Sometimes the signin token is created before 'passwordChangedAt', making the token invalid
  //because of our checking code.
  //One solution is to simply rest one second
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

/**
 * Query middleware.
 * Run whenever we query an user using any method that starts with '/^find/'
 * The goal is to hide the users where "active = false"
 */

userSchema.pre(/^find/, function (next) {
  //this points to the current query
  //Will return all documents where active is '$not equal' to false
  this.find({ active: { $ne: false } });
  next();
});

/**
 * Compare passwords using an instance method
 *
 * Instance method = Method available in all documents(all users) of a certain collection
 *
 *
 * We can't use 'this.password' because we chose to hide the password (select = false),
 * unless we manually selected (+password)
 *
 * That's why we have to pass both passwords to the function.
 */

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

/**
 * Check if the user changed password after the token was issued
 * @param {*} JTWTimestamp
 * JS new Date() requires milliseconds but JWT iat is in seconds after epoch
 */

userSchema.methods.changedPasswordAfter = function (JTWTimestamp) {
  if (this.passwordChangedAt) {
    //getTime() returns milliseconds but JWTTimestamp is in seconds
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    //If the token was created at second 300 and the passoword was changed before at second 200
    //(300 < 200) will return FALSE = the password was not changed after token created
    return JTWTimestamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  //The user will have 10 minutes to reset the password
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
