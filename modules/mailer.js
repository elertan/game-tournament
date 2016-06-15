const nodemailer = require("nodemailer");

const mailer = nodemailer.createTransport({
	host: "localhost",
	port: 9001
});

module.exports = mailer;