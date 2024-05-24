import axios from 'axios';
import { showAlert } from './alerts';

const stripe = Stripe(
  'pk_test_51PIR3tIJS08kBGhfWydOz93P5EY2ED7dAb1iWYITB1akenvcbrn6206FHBGH7gsRydX5rs4AyiOehpXSaeDgNWVg00phvKUcja',
);

export const bookTour = async (tourId) => {
  try {
    //1. Get Checkout session from API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    //2. Create checkout form + charge credit card

    await stripe.redirectToCheckout({ sessionId: session.data.session.id });
  } catch (error) {
    console.log(error);
    showAlert('error', error);
  }
};
