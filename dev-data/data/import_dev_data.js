const mongoose = require('mongoose');
const fs = require('fs');
const dotenv = require('dotenv');
const Tours = require(`${__dirname}/../models/tourModel.js`);

dotenv.config({
    path: `${__dirname}/../config.env`
});

const DB = process.env.DATABASE.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD
);

mongoose.connect(DB, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
}).then(() => {
    console.log("DB Connected Successfully")
});

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours-simple.json`), "utf-8");
console.log(__dirname);

const importData = async () => {
    try {
        await Tours.create(tours);
        console.log("Imported Successfully");
    } catch (error) {
        console.log(error);
    }
    process.exit();
}

const deleteData = async () => {
    try {
        await Tours.deleteMany();
        console.log("Deleted Successfully");
    } catch (error) {
        console.log(error);
    }
    process.exit();
}

if (process.argv[2] === '--import') {
    importData();
} else if (process.argv[2] === '--delete') {
    deleteData();
}