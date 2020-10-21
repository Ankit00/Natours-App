//Route Handlers For Tours
const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const APIFeatures = require('../utils/apiFeatures');
const appError = require('../utils/appError');

//Method to Check if the id is valid or not
/* exports.checkId = (req, res, next, val) => {
  console.log(`Id is ${val}`);
  if (req.params.id * 1 > tours.length) {
    return res.status(404).json({
      status: 'Error',
      message: 'Invalid id'
    });
  }
  next();
}; */

/* exports.checkBody = (req, res, next) => {
  if (!(req.body.price && req.body.name)) {
    return res.status(400).json({
      status: 'Bad Request',
      message: 'Missing Name or Price'
    });
  }
  next();
}; */

//Middleware function for alias route
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = 5;
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  req.query.sort = '-ratingsAverage price';
  next();
};

exports.getAllTours = catchAsync(async (req, res, next) => {
  //Execute the query
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limit()
    .paginate();
  const tours = await features.query;

  //Send Response
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours
    }
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id);
  if (!tour) {
    return next(
      new appError(`No tour is present with the id : ${req.params.id}`, 404)
    );
  }
  res.status(200).json({
    status: 'success',
    requestedDate: req.currentDate,
    data: {
      tour
    }
  });
});

exports.createNewTour = catchAsync(async (req, res, next) => {
  const newTour = await Tour.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      newTour
    }
  });
});

exports.updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  if (!tour) {
    return next(
      new appError(`No tour is present with the id : ${req.params.id}`, 404)
    );
  }
  res.status(200).json({
    status: 'success',
    data: {
      tour
    }
  });
});

exports.deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);
  if (!tour) {
    return next(
      new appError(`No tour is present with the id : ${req.params.id}`, 404)
    );
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: {
        ratingsAverage: {
          $gte: 4.5
        }
      }
    },
    {
      $group: {
        _id: {
          $toUpper: '$difficulty'
        },
        totalTours: {
          $sum: 1
        },
        totalRatings: {
          $sum: '$ratingsQuantity'
        },
        ratingsAverage: {
          $avg: '$ratingsAverage'
        },
        priceAverage: {
          $avg: '$price'
        },
        maxPrice: {
          $max: '$price'
        },
        minPrice: {
          $min: '$price'
        }
      }
    },
    {
      $sort: {
        ratingsAverage: -1
      }
    }
  ]);
  stats.forEach(el => {
    (el.ratingsAverage = Math.round(el.ratingsAverage * 100) / 100),
      (el.priceAverage = Math.round(el.priceAverage * 100) / 100);
  });
  res.status(200).json({
    status: 'success',
    stats
  });
});

//Unwind --  if an object has an array of suppose 3 elements,
//it will create a copy of that object 3 times with each element of the array

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates'
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: {
          $month: '$startDates'
        },
        totalTours: {
          $sum: 1
        },
        tours: {
          $push: '$name'
        }
      }
    },
    {
      $addFields: {
        month: {
          $let: {
            vars: {
              monthsInString: [
                ,
                'January',
                'February',
                'March',
                'April',
                'May',
                'June',
                'July',
                'August',
                'September',
                'October',
                'November',
                'December'
              ]
            },
            in: {
              $arrayElemAt: ['$$monthsInString', '$_id']
            }
          }
        }
      }
    },
    {
      $project: {
        _id: 0
      }
    },
    {
      $sort: {
        totalTours: -1
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    results: plan.length,
    plan
  });
});
