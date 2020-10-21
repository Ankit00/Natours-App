const express = require('express');
const authController = require('../controllers/authController');
const {
  getAllTours,
  getTour,
  createNewTour,
  updateTour,
  deleteTour,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan
} = require('./../controllers/tourController');

const router = express.Router();

//Param Middleware
// router.param('id', checkId);

//Mounting the router
router.route('/top-5-cheap').get(aliasTopTours, getAllTours);

router.route('/tour-stats').get(getTourStats);

router.route('/monthly-plan/:year').get(getMonthlyPlan);

router
  .route('/')
  .get(authController.protect, getAllTours)
  .post(createNewTour);

router
  .route('/:id')
  .get(getTour)
  .patch(updateTour)
  .delete(authController.protect, authController.restrictTo('admin', 'lead-guide'), deleteTour);

module.exports = router;