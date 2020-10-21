const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const appError = require('../utils/appError');

const filterObj = (obj, ...filteredItems) => {
  let newObj = {};
  Object.keys(obj).forEach(key => {
    if (filteredItems.includes(key)) {
      newObj[key] = obj[key];
    }
  });
  return newObj;
};

//Route Handlers For Users
exports.getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find();
  //Send Response
  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users
    }
  });
});

//For updating current user data like name and email
exports.updateMe = catchAsync(async (req, res, next) => {
  //Check if user has inserted password in the req body
  if (req.body.password || req.body.confirmPassword) {
    return next(
      new appError(
        'Please use /updatePassword route for updating password',
        400
      )
    );
  }

  //Filter out the required fields from the body
  const filteredItems = filterObj(req.body, 'name', 'email');
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredItems, {
    new: true,
    runValidators: true
  });

  //Send the response
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

exports.deleteMe = catchAsync(async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success'
  });
});

exports.getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not implemented'
  });
};

exports.updateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not implemented'
  });
};

exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not implemented'
  });
};

exports.createNewUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not implemented'
  });
};
