export const hideAlert = () => {
  const el = document.querySelector('.alert');

  //Remove the element
  if (el) el.parentElement.removeChild(el);
};

//Type is 'success' or 'error'
export const showAlert = (type, msg) => {
  hideAlert();
  const markup = `<div class="alert alert--${type}">${msg}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
  window.setTimeout(hideAlert, 5000);
};
