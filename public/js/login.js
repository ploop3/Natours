//Client side javascript
const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/users/login',
      data: {
        email,
        password,
      },
    });

    console.log(res.data.token);
  } catch (error) {
    console.log(error.response.data);
  }
};

document.querySelector('.form').addEventListener('submit', (evt) => {
  evt.preventDefault(); //does not load a diff page

  //Get data from form
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  login(email, password);
});
