const dotenv = require('dotenv');
const mongoose = require('mongoose');
dotenv.config({
  path: './config.env'
});
const app = require('./app');

process.on('uncaughtException', err => {
  console.log('UNHANDLED EXCEPTION');
  console.log(err.name, err.message);
  process.exit(1);
});

DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(con => {
    console.log('DB Connection Successful');
  });

//console.log(app.get('env'))
const port = process.env.port || 3000;
const server = app.listen(port, () => {
  console.log(`Server Started and listening on port no ${port}`);
});

process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
