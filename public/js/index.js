import '@babel/polyfill';

import { login, logout } from './login';
import { updateSettings } from './updateSettings';

//DOM Elements
const loginForm = document.querySelector('.form--login');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
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
    updateSettings({ name, email }, 'data');
  });
}
if (userPasswordForm) {
  userPasswordForm.addEventListener('submit', async (evt) => {
    evt.preventDefault();

    document.querySelector('.btn--save-password').textContent = 'Updating...';

    const passwordCurrent = document.getElementById('password-current').value;
    const newPassword = document.getElementById('password').value;
    const newPasswordConfirm =
      document.getElementById('password-confirm').value;
    await updateSettings(
      { passwordCurrent, newPassword, newPasswordConfirm },
      'password',
    );

    //Clear fields from
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
    document.querySelector('.btn--save-password').textContent = 'Save password';
  });
}

if (logOutBtn) {
  logOutBtn.addEventListener('click', logout);
}
