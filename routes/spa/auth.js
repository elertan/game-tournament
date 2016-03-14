'use strict';

const express = require('express');
const router = express.Router();

const nodemailer = require('nodemailer');
const randomstring = require('randomstring');
const request = require('request');

const User = require('../../models/user.js');
const LocalUser = require('../../models/local/user.js');
const Registration = require('../../models/registration.js');

const config = require('../../config');
const jwt = require('jsonwebtoken');
const requiredPostParams = require('../../middleware/requiredPostParams.js');

const transporter = nodemailer.createTransport({
	host: 'localhost',
	port: 9001
});

// Add routes here
router.get('/login', function (req, res) {
	res.render('spa/auth/login');
});

router.post('/login', requiredPostParams(['password', 'studentnumber']), function (req, res) {
	const form = req.body;
	
	const password = form.password;
    const studentNumber = form.studentnumber;
	
	if (isNaN(studentNumber)) {
		res.json({ err: 'Student nummer moet een getal zijn' });
		return;
	}
	
	if (studentNumber.length != 8) {
		res.json({ err: 'Studentnummer moet 8 getallen zijn' });
		return;
	}
	
	LocalUser.findOne({studentnumber: studentNumber}, function (err, user) {
		if (!user) {
			res.json({err: 'Gebruiker niet gevonden'});
			return;
		}
		
		user.validPassword(password, function (same) {
			if (!same) {
				res.json({ err: 'verkeerd wachtwoord' });
				return;
			}
			
			const token = jwt.sign(user, config.secret, { expiresIn: config.auth.expirationTime.toString() });
			
			res.json({token: token, user: user});
		});
		
	});
});

router.get('/register', function (req, res) {
	res.render('spa/auth/register');
});

router.post('/register', requiredPostParams(['studentnumber']), function (req, res) {
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
			res.json({ err: 'Er is al een email gestuurd naar dit studentnummer' });
			return;
		}
		
		const code = randomstring.generate();
				
		const reg = new Registration({
			studentnumber: studentnumber,
			verificationCode: code
		});
		
		reg.save(function (err, saveResult) {
			if (err) {
				res.json({ err: 'Interne server fout' });
			}
			const data = {
				from: 'info@gametournament.nl',
				to: email,
				subject: 'Account Activatie',
				text: 'Beste Leerling,\n\nDruk op deze link om jouw account aan te maken http://localhost:1337/#/auth/register/' + code + '\n\nMet vriendelijke groet,\n\nHet game tournament team'
			};
			
			transporter.sendMail(data, function (err, info) {
				if (!err) {
					res.json({ msg: 'Er is een email naar ' + email + ' gestuurd.' });
				} else {
					res.json({ err: 'Er is een fout opgetreden, probeer het later overnieuw.' });
				}
			});
		});
	});
});

router.get('/forgotPassword', function (req, res) { 
	res.render('spa/auth/forgotPassword');
});

router.post('/forgotPassword', requiredPostParams(['studentNumber']), function (req, res) {
	
});

router.get('/register/verify', function (req, res) {
	res.render('spa/auth/register/verify');
});

router.get('/register/verifyData/:verificationCode', function (req, res) {
	const code = req.params.verificationCode;
	Registration.findOne({ verificationCode: code }, function (err, registration) {
		if (err) {
			res.json({
				err: 'Er is een fout opgetreden, probeer het later opnieuw'
			});
			return;
		}
		if (!registration) {
			res.json({
				err: 'Onjuiste verificatie code'
			});
			return;
		}
		res.json({
			registration: registration
		});
	});
});

router.post('/register/verify', requiredPostParams(['password', 'repassword', 'firstname', 'lastname', 'verificationCode', 'studentnumber']), function (req, res) {
	const form = req.body;

	if (form.password != form.repassword) {
		res.json({ err: 'Wachtwoorden komen niet overeen' });
		return;
	}

	Registration.findOne({ studentnumber: form.studentnumber }, function (err, registration) {
		if (err) {
			res.json({
				err: 'Er is een fout opgetreden, probeer het later opnieuw'
			});
			return;
		}
		if (!registration) {
			res.json({
				err: 'Er bestaat geen registratie voor dit studentnummer'
			});
			return;
		}
		if (registration.verificationCode != form.verificationCode) {
			res.json({
				err: 'Nice try bitch'
			});
			return;
		}

		registration.remove();

		request.post({
			url: 'http://localhost:1337/api/auth/register',
			form: {
				email: form.studentnumber + '@mydavinci.nl',
				password: form.password
			}
		}, function (err, httpRes, body) {
			const data = JSON.parse(body);
			if (data.err) {
				res.json({ err: data.err });
				return;
			}

			const localUser = new LocalUser(data.user);
			localUser.firstname = form.firstname;
			localUser.lastname = form.lastname;
			localUser.studentnumber = parseInt(form.studentnumber);

			request.post({
				url: 'http://localhost:1337/api/auth/login',
				form: {
					email: form.studentnumber + '@mydavinci.nl',
					password: form.password
				}
			}, function (err, httpRes, body) {
				const data = JSON.parse(body);
				
				if (data.err) {
					// Handle error
					return;
				}
				localUser.jwt = data.token;
				
				
				localUser.save(function (err) {
					res.json({ stateChange: 'auth/login' });
				});
			});
		});
	});
});

module.exports = router;