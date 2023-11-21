const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

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
    },
    message: 'Passwords are not the same',
  },
});

/**
 * Encrypt the password
 *
 * Happens between the moment we receive the data and the moment when it is 'saved' in the DB
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

const User = mongoose.model('User', userSchema);

module.exports = User;
