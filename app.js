const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');
const cookieParser = require('cookie-parser');

const globalErrorHandler = require('./controllers/errorController');
const AppError = require('./utils/appError');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');

//Will add a bunch of methods to our app variable
const app = express();

//Frontend: Template engine pug
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1) GLOBAL Middlewares
//Serving static files
app.use(express.static(path.join(__dirname, 'public')));

//Set security HTTP headers
app.use(
  helmet({
    contentSecurityPolicy:
      process.env.NODE_ENV === 'production' ? undefined : false,
  }),
);

//Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//Limits each IP to 100 requests per window (15 minutes)
const limiter = rateLimit({
  limit: 100,
  windowMs: 15 * 60 * 1000,
  message: {
    status: 'fail',
    data: {
      message: 'Too many requests from this IP, please try again in an hour!',
    },
  },
});

//Will apply only to the routes that start with /api
app.use('/api', limiter);

//Body parser, reading data from body into req.body
//Limit the size of the body, if it's larger it won't be accepted
app.use(
  express.json({
    limit: '10kb',
  }),
);
//Needed to parse data coming from an urlencoded "form"
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

//cookieParser will add the cookies into req.cookies
app.use(cookieParser());

//Data sanitization against NoSQL query injection
app.use(mongoSanitize());

//Data sanitization against XSS
app.use(xss());

//Prevent parameter pollution
//Whitelist parameters to be allowed
//localhost:3000/api/v1/tours/?duration=5&duration=9
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

// 2) ROUTES
//Mount view routes to the app
app.use('/', viewRouter);

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

// 3) Capture errors
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
