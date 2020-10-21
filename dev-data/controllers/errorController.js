const appError = require('../utils/appError');

const handleUnknownIdDB = err => {
  const message = `Invalid ${err.path} : ${err.value}`;
  return new appError(message, 404);
};

const handleDuplicateNamesDB = err => {
  const value = err.errmsg.match(/"([^"]*)"/)[0];
  const message = `Duplicate Field Value : ${value} Please use another value`;
  return new appError(message, 404);
};

const handleValidationDB = err => {
  const message = Object.values(err.errors).map(el => el.message);
  return new appError(message.join('. '), 404);
};

const handleJsonWebTokenError = () => {
  return new appError('Invalid token, Please login Again', 401);
};

const handleTokenExpiredError = () => {
  return new appError('Token expired,Please Login Again', 401);
};

const logErrorProduction = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } else {
    console.error(err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!!'
    });
  }
};

const logErrorDevelopment = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    stack: err.stack,
    message: err.message
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'production ') {
    let error = {
      ...err
    };
    if (error.name === 'CastError') error = handleUnknownIdDB(error);
    if (error.code === 11000) error = handleDuplicateNamesDB(error);
    if (error.name === 'ValidationError') error = handleValidationDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJsonWebTokenError();
    if (error.name === 'TokenExpiredError') error = handleTokenExpiredError();
    logErrorProduction(error, res);
  }
  if (process.env.NODE_ENV === 'development') logErrorDevelopment(err, res);
};
