const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');
const appError = require('../utils/appError');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/email');
const { promisify } = require('util');

const signToken = id => {
  return jwt.sign(
    {
      id
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.EXPIRES_IN
    }
  );
};

const createTokenAndSendResponse = (user, statusCode, res) => {
  const token = signToken(user._id);
  res.status(statusCode).json({
    status: 'success',
    token,
    user
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    role: req.body.role,
    changedPasswordAt: req.body.changedPasswordAt
  });
  createTokenAndSendResponse(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //Check if email and password exists
  if (!email || !password) {
    return next(new appError('Please enter email and password', 400));
  }
  const user = await User.findOne({
    email
  }).select('+password');

  //Authenticate if password is correct
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new appError('Invalid email or password', 401));
  }
  createTokenAndSendResponse(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  //Check whether token exists in the req headers or not
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(new appError('You are not logged in! Please login', 401));
  }
  //Verification of token
  const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //Check if the user still exists
  const currentUser = await User.findById(decode.id);
  if (!currentUser) {
    return next(new appError('User does not exists', 401));
  }
  //Check if the password has been changed after token is assigned
  if (currentUser.changedPassword(decode.iat, 10)) {
    return next(
      new appError(
        'Password has been changed after token assignment,Please login again',
        401
      )
    );
  }
  //Authentication Complete
  req.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new appError(
          'You are not allowed to delete this tour!Permission Denied!!',
          403
        )
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //Chceking whether user exists for a particular mail id
  const user = await User.findOne({
    email: req.body.email
  });
  if (!user) {
    return next(
      new appError(`No user is present with ${req.body.email} email id`, 404)
    );
  }
  //Creating reset token
  const resetToken = user.generateResetPasswordToken();
  await user.save({
    validateBeforeSave: false
  });
  const resetUrl = `${req.protocol}://${req.hostname}/api/v1/users/resetPassword/:${resetToken}`;
  const message = `Forgot your password? Submit a patch request with your new password and confirmPassword to <a href=${resetUrl}>${resetUrl}</a>.<br>If you didn't forgotPassword your password, Please ignore this MediaList.`;
  const subject = 'Your password reset token (Valid for 10 minutes)';

  //Send mail and handling errors
  try {
    await sendEmail({
      email: user.email,
      subject,
      message
    });

    res.status(200).json({
      status: 'success',
      message: 'Email sent successfully'
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordTokenExpiresAt = undefined;
    await user.save({
      validateBeforeSave: false
    });
    next(new appError('Unable to send mail.Please try again', 500));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordTokenExpiresAt: {
      $gt: Date.now()
    }
  });

  //If user exists and token is not expired set new password
  if (!user) {
    return next(new appError('The token is Invalid or Expired', 400));
  }
  console.log({
    user
  });
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordTokenExpiresAt = undefined;
  await user.save();

  //Send the response back
  createTokenAndSendResponse(user, 200, res);
});

//Updating Logged in user password

exports.updatePassword = catchAsync(async (req, res, next) => {
  //Get User From Collection
  const user = await User.findById(req.user.id).select('+password');

  //Validate currentUser password provided by users
  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return next(new appError('Invalid Password!', 401));
  }
  //Save new password
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  await user.save();

  //login user and send JWT token
  createTokenAndSendResponse(user, 200, res);
});
