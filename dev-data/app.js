const express = require('express');
const app = express();
const morgan = require('morgan');
const appError = require('./utils/appError.js');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routers/tourRoutes');
const userRouter = require('./routers/userRoutes');
//Using middleware for handling request body

//For serving static files
app.use(express.static('../public'));

//For Parsing the request body
app.use(express.json());

//Middlewares

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use((req, res, next) => {
  req.currentDate = new Date().toISOString();
  next();
});

//Routing for Tours
app.use('/api/v1/tours', tourRouter);
//Routing for Users
app.use('/api/v1/users', userRouter);
//Handling undefined routes
app.all('*', (req, res, next) => {
  next(new appError(`Can not find to the ${req.originalUrl} url`, 404));
});

//Creating a global error handling middleware

app.use(globalErrorHandler);

//Server
module.exports = app;