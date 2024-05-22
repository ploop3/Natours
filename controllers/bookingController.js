const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY);
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handleFactory');
const AppError = require('../utils/appError');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  //1. Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);

  //2. Create Stripe product and Stripe Payment objects

  //3. create checkout session
  //Insecure way to confirm a booking using query params
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        price: 'price_1PIczgIJS08kBGhfVFkirbVw',
        quantity: 1,
      },
    ],
  });

  // 3. Send session as response
  res.status(200).json({
    status: 'success',
    session,
  });
  // res.redirect(303, 'http://localhost:3000')
});

/**
 * TEMP solution
 * We will hit this endpoint twice, one with all three query params
 * to create the booking in the DB, and the second without params
 * to show the overview page(next middleware)
 */
exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  const { tour, user, price } = req.query;
  if (!tour && !user && !price) return next();
  await Booking.create({ tour, user, price });

  //redirect to stripe success_url
  res.redirect(req.originalUrl.split('?')[0]);
});
