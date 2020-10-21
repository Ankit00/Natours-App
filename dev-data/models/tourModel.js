const mongoose = require('mongoose');
const slugify = require('slugify');
const translate = require('@vitalets/google-translate-api');

const TourSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: [true, 'A tour must have a name field'],
    minlength: [10, 'A tour name must have minimum length of 10'],
    maxlength: [50, 'A tour name length must be less than 50']
  },
  slug: String,
  ratingsAverage: {
    type: Number,
    default: 4.5,
    min: [1.0, 'Rating should be greater than or equal to 1.0'],
    max: [5.0, 'Rating should be lesser than or equal to 5.0']
  },
  price: {
    type: Number,
    required: [true, 'A tour must have a price field']
  },
  duration: {
    type: Number,
    required: [true, 'A tour must have a duration']
  },
  maxGroupSize: {
    type: Number,
    required: [true, 'A tour must have a group size']
  },
  difficulty: {
    type: String,
    required: [true, 'A tour must have a difficulty'],
    enum: {
      values: ['easy', 'difficult', 'medium'],
      message: 'Difficulty could be either : easy, medium or difficult'
    }
  },
  ratingsQuantity: {
    type: Number,
    default: 0
  },
  priceDiscount: {
    type: Number,
    //Custom Validators (Only works when we create a new document and doesn't work on update)
    validate: {
      validator: function (val) {
        return val < this.price;
      },
      message: 'The discounted price should be less than the actual price.'
    }
  },
  summary: {
    type: String,
    trim: true,
    required: [true, 'A tour must have a description']
  },
  description: {
    type: String,
    trim: true
  },
  imageCover: {
    type: String,
    required: [true, 'A tour must have a imageCover']
  },
  images: [String],
  createdAt: {
    type: Date,
    default: Date.now(),
    //To hide particular fields from getting displayed on the client end
    select: false
  },
  startDates: [Date],
  secretTour: {
    type: Boolean,
    default: false
  }
}, {
  toJSON: {
    virtuals: true
  },
  toObject: {
    virtuals: true
  }
});

//Virtual Properties(Don't get added to the database saves space)
//Need to provide virtuals : true in the schema
TourSchema.virtual('durationInWeeks').get(function () {
  return Math.round((this.duration / 7) * 100) / 100;
});

//Mongoose Middlewares (Pre and Post Hooks)
//To run functions before or after a particular event i.e. Save or Create
//Document , Query , Aggregate and Model (Types of midlewares in mongoose)

//Document Middleware runs before or after .save() and .create()

TourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, {
    lower: true
  });
  next();
});

/* TourSchema.pre('save', function(next) {
  console.log('This is the 2nd pre hook');
  next();
});

TourSchema.post('save', function(data, next) {
  console.log(data);
  next();
});
*/

//Query Middlewares

TourSchema.pre(/^find/, function (next) {
  this.find({
    secretTour: {
      $ne: true
    }
  });
  this.start = Date.now();
  next();
});

TourSchema.post(/^find/, function (docs, next) {
  console.log(`Total Time Taken : ${Date.now() - this.start}ms`);
  next();
});

//Aggregation Middlewares

TourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({
    $match: {
      secretTour: {
        $ne: true
      }
    }
  });
  console.log(this.pipeline());
  next();
});

const Tour = mongoose.model('Tour', TourSchema);

module.exports = Tour;

/* const englishTranslation = text => {
  return new Promise(async (resolve, reject) => {
    resolve(await translate(text, { from: 'la', to: 'en' }));
  });
};

TourSchema.virtual('descriptionInEnglish').get(async function() {
  return await translate(this.description, { from: 'la', to: 'en' });
}); */