const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();

const {
  getAllUsers,
  getUser,
  createNewUser,
  deleteUser,
  updateUser,
  updateMe,
  deleteMe
} = require('../controllers/userController');

router.post('/signup', authController.signup);
router.post('/login', authController.login);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

router.patch(
  '/updatePassword',
  authController.protect,
  authController.updatePassword
);

router.patch('/updateMe', authController.protect, updateMe);
router.patch('/deleteMe', authController.protect, deleteMe);

router
  .route('/')
  .get(getAllUsers)
  .post(createNewUser);

router
  .route('/:id')
  .get(getUser)
  .patch(updateUser)
  .delete(deleteUser);

module.exports = router;
