const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY);
const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handleFactory');
const AppError = require('../utils/appError');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  //1. Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);

  //2. Create Stripe product and Stripe Payment objects

  //3. create checkout sessoin
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    success_url: `${req.protocol}://${req.get('host')}/`,
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
