const nodemailer = require('nodemailer');

const sendEmail = async options => {
  //Creating a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  //Setting mail options
  const mailOptions = {
    from: 'Ankit Singh <batman@gotham.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: `<h1>${options.message}</h1>`
  };

  //Sending the mail
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
