'use strict';

const express = require('express');
const router = express.Router();

const nodemailer = require('nodemailer');
const randomstring = require('randomstring');
const request = require('request');

const User = require('../../models/user.js');
const LocalUser = require('../../models/local/user.js');
const Registration = require('../../models/local/registration.js');
const BlockedUserLogin = require('../../models/local/blockedUserLogin.js');
const PasswordReset = require('../../models/local/password-reset.js');

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

function WrongLogin(req) {
		BlockedUserLogin.findOne({ blockedIp: req.connection.remoteAddress }, function (err, blockedUserLogin) {
		if(!err)
		{
			//This blockedUserLogin doesnt exist yet
			if (!blockedUserLogin) 
			{
				const blockedUserLogin = new BlockedUserLogin({ blockedIp: req.connection.remoteAddress, timesFailed: 1 });
				blockedUserLogin.save();
				return;
			}
			
			if (blockedUserLogin.timesFailed < 3)
			{
				blockedUserLogin.timesFailed++;
				blockedUserLogin.save();
				
				if(blockedUserLogin.timesFailed == 3)
				{
					var now = new Date();
					var blockEndDate = new Date(now);
					
					//blockEndDate.setSeconds(blockEndDate.getSeconds() + 10);
					// blockEndDate.setDate(blockEndDate.getDate() + 7);
					blockEndDate.setHours(blockEndDate.getHours() + 4);
					
					blockedUserLogin.blockedTillDate = blockEndDate;
					blockedUserLogin.save();
				}
			}
		}
		else
		//There was an error
		{
			console.log(err);
		}
	});
}

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
	
	BlockedUserLogin.findOne({ blockedIp: req.connection.remoteAddress }, function(err, blockedUserLogin) {
		if (blockedUserLogin && blockedUserLogin.blockedTillDate) {
			const now = new Date();
			if (now > blockedUserLogin.blockedTillDate) {
				BlockedUserLogin.remove({ blockedIp: req.connection.remoteAddress });
				return;
			} else {
				res.json({ err: 'Je hebt tevaak verkeerd ingelogd, je kan weer inloggen op de volgende datum: ' + blockedUserLogin.blockedTillDate });
				return;
			}
		}
		
		LocalUser.findOne({ studentnumber: studentNumber }, function (err, user) {
			if (!user) {
				res.json({err: 'Gebruiker niet gevonden'});
				return;
			}
			
			user.validPassword(password, function (same) {
				if (!same) {
					BlockedUserLogin.findOne({ blockedIp: req.connection.remoteAddress }, function (err, blockedUserLogin) {
						if (!blockedUserLogin) {
							const blockedUserLogin = new BlockedUserLogin({ blockedIp: req.connection.remoteAddress, timesFailed: 1 });
							blockedUserLogin.save();
							
							res.json({ err: 'Verkeerd wachtwoord mark' });
							return;
						}
						
						blockedUserLogin.timesFailed++;
						
						if (blockedUserLogin.timesFailed > 2) {
							var now = new Date(new Date().getTime() + 60 * 60000);
							var blockEndDate = new Date(now.getTime() + Math.pow(2, blockedUserLogin.timesFailed - 2)  * 60000); // Add 5 minutes
							
							blockedUserLogin.blockedTillDate = blockEndDate;
						}
						
						blockedUserLogin.save();
						
						res.json({ err: 'Verkeerd wachtwoord, poging ' + blockedUserLogin.timesFailed });
						return;
					});
					return;
				}
				
				const token = jwt.sign(user, config.secret, { expiresIn: config.auth.expirationTime.toString() });
				res.json({token: token, user: user});
			});
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
	
	LocalUser.findOne({ studentnumber: parseInt(form.studentnumber) }, function (err, localUser) {
		if (localUser) {
			res.json({ err: 'Deze student is al geregistreerd' });
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
});

router.get('/forgotPassword', function (req, res) { 
	res.render('spa/auth/forgotPassword');
});

router.post('/forgotPassword', requiredPostParams(['studentNumber']), function (req, res) {
	const form = req.body;

	const password = form.password;
	const studentNumber = form.studentNumber;

	if (isNaN(studentNumber)) {
		res.json({ err: 'Studentnummer moet een getal zijn' });
		return;
	}

	if (studentNumber.length != 8) {
		res.json({ err: 'Studentnummer moet 8 getallen zijn' });
		return;
	}

	LocalUser.findOne({ studentnumber: studentNumber }, function (err, user) {
		if (!user) {
			res.json({ err: 'Deze student heeft nog geen account geregistreerd' });
			return;
		}

		PasswordReset.findOne({ studentnumber: studentNumber }, function (err, passwordReset) {
			if (err) {
				return;
			}
			if (passwordReset) {
				res.json({ err: 'Deze student heeft al een wachtwoord reset aangevraagd' });
				return;
			}

			const code = randomstring.generate();

			const passReset = new PasswordReset({
				verificationCode: code,
				studentnumber: studentNumber
			});

			passReset.save();

			const email = studentNumber + '@mydavinci.nl';

			const data = {
				from: 'info@gametournament.nl',
				to: email,
				subject: 'Wachtwoord Vergeten',
				text: 'Beste Leerling,\n\nDruk op deze link om jouw wachtwoord te resetten http://localhost:1337/#/auth/forgotPassword/' + code + '\n\nMet vriendelijke groet,\n\nHet game tournament team'
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

router.get('/forgotPassword/verify', function (req, res) {
	res.render('spa/auth/forgotPassword/verify');
});

router.get('/forgotPasswordData/:verificationCode', function (req, res) {
	const code = req.params.verificationCode;
	PasswordReset.findOne({ verificationCode: code }, function (err, passReset) {
		if (err) {
			res.json({
				err: 'Er is een fout opgetreden, probeer het later opnieuw'
			});
			return;
		}
		if (!passReset) {
			res.json({
				err: 'Onjuiste verificatie code'
			});
			return;
		}
		res.json({
			passwordReset: passReset
		});
	});
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

router.post('/forgotPassword/verify', requiredPostParams(['password', 'repassword', 'verificationCode', 'studentnumber']), function (req, res) {
	const form = req.body;

	if (form.password != form.repassword) {
		res.json({ err: 'Wachtwoorden komen niet overeen' });
		return;
	}

	PasswordReset.findOne({ studentnumber: form.studentnumber }, function (err, passwordReset) {
		if (err) {
			res.json({
				err: 'Er is een fout opgetreden, probeer het later opnieuw'
			});
			return;
		}
		if (!passwordReset) {
			res.json({
				err: 'Er bestaat geen reset voor dit studentnummer'
			});
			return;
		}
		if (passwordReset.verificationCode != form.verificationCode) {
			res.json({
				err: 'Nice try bitch'
			});
			return;
		}

		LocalUser.findOne({ studentnumber: form.studentnumber }, function (err, localUser) {
			passwordReset.remove();

			request.post({
				url: 'http://localhost:1337/api/auth/changePassword',
				form: {
					email: form.studentnumber + '@mydavinci.nl',
					password: form.password,
					oldpassword: localUser.password
				}
			}, function (err, httpRes, body) {
				const data = JSON.parse(body);
				if (data.err) {
					res.json({ err: data.err });
					return;
				}

				if (data.success) {
					localUser.password = data.password;
					localUser.save();
					res.json({ msg: 'Wachtwoord gereset' });
				}
			});
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