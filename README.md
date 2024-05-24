# Instructions

## Create environment variables
Create a new config.env file that will contain the following variables

NODE_ENV=development  
PORT=3000  

### MongoDB 
DATABASE=mongodb+srv://<USERNAME>:<PASSWORD>@URL...  
USERNAME_DATABASE=  
PASSWORD_DATABASE=  

### JSON Web Tokens
JWT_SECRET=euirtjvmmwqop_@!skdpc  
JWT_EXPIRES_IN=10d  

### Email
EMAIL_USERNAME=  
EMAIL_PASSWORD=  
EMAIL_HOST=...mailtrap.io  
EMAIL_PORT=  
EMAIL_FROM=noreply@company.com  

### Stripe
STRIPE_PRIVATE_KEY  

##  Run the app

### Install dependencies
`npm install`

### Generate libs bundle with parcel
`npm run build:js`

### Start the app
`npm start`
