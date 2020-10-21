const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const validator = require('validator');
const crypto = require('crypto');

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A user must have a name']
  },
  email: {
    type: String,
    unique: true,
    required: [true, 'A user must have an email address'],
    validate: [validator.isEmail, 'Please enter a valid email id'],
    lowercase: true
  },
  photo: String,
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin']
  },
  password: {
    type: String,
    required: [true, 'A user must have a password'],
    minlength: [8, 'password length must be greater 7'],
    select: false
  },
  confirmPassword: {
    type: String,
    validate: {
      //This only works on create or save
      validator: function(val) {
        return val === this.password;
      },
      message: 'Password do not match'
    },
    required: [true, 'A user must confirm Password']
  },
  changedPasswordAt: Date,
  passwordResetToken: String,
  passwordTokenExpiresAt: Date,
  active: {
    type: 'boolean',
    default: true,
    select: false
  }
});

userSchema.pre('save', async function(next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  //Hash the password with cost of 12
  this.password = await bcryptjs.hash(this.password, 12);

  //Delete the confirmPassword field from the database
  this.confirmPassword = undefined;
});

userSchema.pre('save', async function(next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password') || this.isNew) return next();
  this.changedPasswordAt = Date.now() - 2000;
  next();
});

userSchema.pre(/^find/, function(next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function(
  enteredPassword,
  userPassword
) {
  return await bcryptjs.compare(enteredPassword, userPassword);
};

userSchema.methods.changedPassword = function(JWTTokenAssignedAt) {
  if (this.changedPasswordAt) {
    const changedPasswordinMils = parseInt(
      this.changedPasswordAt.getTime() / 1000,
      10
    );
    return changedPasswordinMils > JWTTokenAssignedAt;
  }
  return false;
};

userSchema.methods.generateResetPasswordToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordTokenExpiresAt = Date.now() + 600000;
  console.log(
    {
      resetToken
    },
    this.passwordResetToken
  );
  return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
