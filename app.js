const express = require('express');
const morgan = require('morgan');

const globalErrorHandler = require('./controllers/errorController');
const AppError = require('./utils/appError');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

//Will add a bunch of methods to our app variable
const app = express();

//Middlewares
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());
app.use(express.static(`${__dirname}/public/`));

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

//Middleware to caputure unhandled routes.
//If it reached this point it means it was not for tours nor users
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server!`,
  // });

  //Option 2 to trow the error
  // const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  // err.status = 'fail';
  // err.statusCode = 404;
  // next(err);

  //Option 3 to throw the erorr
  //If next receives an argument, Express will automatically know it is an error
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

//Middleware to capture all errors
//We need to pass 4 argumemts to make Express recognize it as an error handling middleware
//Will be called only when there's an error
app.use(globalErrorHandler);

module.exports = app;
