import '@babel/polyfill';

import { login } from './login';

//DOM Elements
const loginForm = document.querySelector('.form');

if (loginForm) {
  loginForm.addEventListener('submit', (evt) => {
    evt.preventDefault(); //does not load a diff page

    //Get data from form
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}
