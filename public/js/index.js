import '@babel/polyfill';

import { login, logout } from './login';
import { updateData } from './updateSettings';

//DOM Elements
const loginForm = document.querySelector('.form--login');
const userDataForm = document.querySelector('.form-user-data');
const logOutBtn = document.querySelector('.nav__el--logout');

if (loginForm) {
  loginForm.addEventListener('submit', (evt) => {
    evt.preventDefault(); //does not load a diff page

    //Get data from form
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}
if (userDataForm) {
  userDataForm.addEventListener('submit', (evt) => {
    evt.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    updateData(name, email);
  });
}

if (logOutBtn) {
  logOutBtn.addEventListener('click', logout);
}
