# Instructions

## Create environment variables
Create a new config.env file that will contain the following variables

NODE_ENV=development
PORT=3000
DATABASE=mongodb+srv://<USERNAME>:<PASSWORD>@URL...
USERNAME_DATABASE=
PASSWORD_DATABASE=
JWT_SECRET=euirtjvmmwqop_@!skdpc
JWT_EXPIRES_IN=30d

EMAIL_USERNAME=
EMAIL_PASSWORD=
EMAIL_HOST=...mailtrap.io
EMAIL_PORT=
EMAIL_FROM='noreply@company.com'

##  Run the app

### Install dependencies
`npm install`

### Generate libs bundle with parcel
`npm run build:js`

### Start the app
`npm start`
