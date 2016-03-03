'use strict';

const express = require('express');
const router = express.Router();

// Add routes here
router.get('/login', function (req, res) {
	res.render('spa/auth/login');
});

router.get('/register', function (req, res) {
	res.render('spa/auth/register');
});

router.post('/register', function (req, res) {
	const form = req.body;
	
	if (isNaN(form.studentnumber)) {
		res.json({ err: 'Studentnumber must be a number' });
		return;
	}
	
	if (form.studentnumber.length < 8) {
		res.json({ err: 'Studentnumber must contain 8 numbers' });
		return;
	}
	
	var nodemailer = require('nodemailer');
	var smtpTransport = require('nodemailer-smtp-transport');

	var transporter = nodemailer.createTransport(smtpTransport({
		host: 'localhost',
		port: 25,
		// auth: {
		// 	user: 'info@gametournament.nl',
		// 	pass: ''
		// }
	}));
	
	// send mail
	transporter.sendMail({
		from: 'denkievits@gmail.com',
		to: 'patrickvonk@hotmail.com',
		subject: 'hello playground!',
		text: 'Authenticated with OAuth2'
	}, function(error, response) {
	if (error) {
			console.log(error);
	} else {
			console.log('Message sent');
	}
	});
	
	res.json({ msg: 'An email has been send to ' + form.studentnumber + '@mydavinci.nl' });
});

module.exports = router;