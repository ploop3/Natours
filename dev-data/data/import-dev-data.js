const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('../../models/tourModel');
const Review = require('../../models/reviewModel');
const User = require('../../models/userModel');

dotenv.config({ path: '../../config.env' });

let DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.PASSWORD_DATABASE,
);
DB = DB.replace('<USERNAME>', process.env.USERNAME_DATABASE);

console.log(DB);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
  })
  .then(() => console.log('DB connection successful'));

//Read JSON file
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'),
);

//Import data into DB
const importData = async () => {
  try {
    await Tour.create(tours);
    //Skip password encryption by temporarily commenting the middlewares in userModel.js
    //Skip validation because we are not providing passwordConfirm (frontend param only)
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log('Data successfully loaded!');
  } catch (error) {
    console.log(error);
  }
  process.exit();
};

//Delete all tours
const deleteData = async () => {
  try {
    await Tour.deleteMany({});
    await Review.deleteMany({});
    await User.deleteMany({});
    console.log('Data successfully removed!');
  } catch (error) {
    console.log(error);
  }
  process.exit();
};

// will be executed based on the command:
//> node import-dev-data.js --import
//> node import-dev-data.js --delete

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
