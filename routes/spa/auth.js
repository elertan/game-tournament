'use strict';

const express = require('express');
const router = express.Router();

//const mailgun = require('mailgun-js')({ apiKey: 'key-95c69f24df3cf38a009998e4dcc8bb24', domain: 'sandbox18d026f44d7d4065b80d49564681004e.mailgun.org' });
const nodemailer = require('nodemailer');
const randomstring = require('randomstring');

const User = require('../../models/user.js');
const Registration = require('../../models/registration.js');

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
		res.json({ err: 'Studentnummer moet een getal zijn' });
		return;
	}
	
	if (form.studentnumber.length != 8) {
		res.json({ err: 'Studentnummer moet 8 getallen zijn' });
		return;
	}
	
	const email = form.studentnumber + '@mydavinci.nl';
	const studentnumber = parseInt(form.studentnumber);

	Registration.findOne({ studentnumber: studentnumber }, function (err, registration) {
		if (registration) {
			return;
		}
		
		const data = {
			from: 'info@gametournament.nl',
			to: email,
			subject: 'Account Activatie',
			text: 'Beste Leerling,\n\nDruk op deze link om jouw account aan te maken http://localhost:1337/#/auth/register/Adu342hda8asdm\n\nMet vriendelijke groet,\n\nHet game tournament team'
		};
		
		const transporter = nodemailer.createTransport({
			host: 'localhost',
			port: 9998
		});
		
		transporter.sendMail(data, function (err, info) {
			if (!err) {
				const code = randomstring.generate();
				
				const registration = new Registration({
					studentnumber: studentnumber,
					verificationCode: code
				});
				
				res.json({ msg: 'Er is een email naar ' + email + ' gestuurd.' });
			} else {
				res.json({ err: 'Er is een fout opgetreden, probeer het later overnieuw.' });
			}
		});
	});
});

router.get('/register/:verificationCode', function (req, res) {
	const code = req.params.verificationCode;
	
	
});

module.exports = router;