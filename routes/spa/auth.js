'use strict';

const express = require('express');
const router = express.Router();

const nodemailer = require('nodemailer');
const randomstring = require('randomstring');
const apiCall = require('../../modules/apiCall');

const User = require('../../models/user.js');
const Registration = require('../../models/registration.js');
const BlockedUserLogin = require('../../models/blockedUserLogin.js');
const PasswordReset = require('../../models/password-reset.js');

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
	
	User.findOne({ studentnumber: studentNumber }, function (err, user) {
		if (!user) {
			res.json({err: 'Gebruiker niet gevonden'});
			return;
		}
		
		user.validPassword(password, function (same) {
			if (!same) 
			{
				BlockedUserLogin.findOne({ blockedIp: req.connection.remoteAddress }, function (err, blockedUserLogin) {
					if (!blockedUserLogin) {
						const blockedUserLogin = new BlockedUserLogin({ blockedIp: req.connection.remoteAddress, timesFailed: 1 });
						blockedUserLogin.save();
						
						res.json({ err: 'Verkeerd wachtwoord' });
						return;
					}
					
					var now = new Date(new Date() + 60 * 60000);// + 60 * 60000
					
					if (blockedUserLogin.timesFailed < 3) {
						blockedUserLogin.timesFailed++;
					}
					
					if (blockedUserLogin.timesFailed == 3 && blockedUserLogin.blockedTillDate == null) {
						
						var result = Math.pow(2, blockedUserLogin.timesFailed - 2)  * 60000;
						var blockEndDate = new Date(now.getTime() + Math.pow(2, blockedUserLogin.timesFailed - 2)  * 60000);
						
						blockedUserLogin.blockedTillDate = blockEndDate;
					}
					
					if (now > blockedUserLogin.blockedTillDate) {
						
						blockedUserLogin.timesFailed++;
						var result = Math.pow(2, blockedUserLogin.timesFailed - 2)  * 60000;
						var blockEndDate = new Date(now.getTime() + Math.pow(2, blockedUserLogin.timesFailed - 2)  * 60000);
						
						blockedUserLogin.blockedTillDate = blockEndDate;
					}
					
					blockedUserLogin.save();
					
					if(blockedUserLogin.blockedTillDate)
					{
						res.json({ err: 'U heeft te vaak een verkeerde inlog poging gehad, u kunt weer op: ' + blockedUserLogin.blockedTillDate + ' inloggen'});
						return;	
					}
					else
					{
						res.json({ err: 'Verkeerde inlogpoging nog: ' + (3 - blockedUserLogin.timesFailed) + ' pogingen tot je voor een bepaalde tijd niet kan inloggen'});
						return;		
					}
				});
				return;
			}
			
			BlockedUserLogin.findOne({ blockedIp: req.connection.remoteAddress }, function (err, blockedUserLogin) {
				if(blockedUserLogin)
				{
					if (blockedUserLogin.blockedTillDate) {
						
						var now = new Date(new Date() + 60 * 60000);// + 60 * 60000
						if (now > blockedUserLogin.blockedTillDate) 
						{			
							BlockedUserLogin.remove({ blockedIp: req.connection.remoteAddress }, function(err, removedDocument)	{
								const token = jwt.sign(user, config.secret, { expiresIn: config.auth.expirationTime.toString() });
								res.json({token: token, user: user});
							});
							return;
						}
						else
						{
							res.json({ err: 'U heeft te vaak een verkeerde inlog poging gehad, u kunt weer op: ' + blockedUserLogin.blockedTillDate + ' inloggen'});
							return;	
						}
					}
					
					BlockedUserLogin.remove({ blockedIp: req.connection.remoteAddress }, function(err, removedDocument)	{
						const token = jwt.sign(user, config.secret, { expiresIn: config.auth.expirationTime.toString() });
						res.json({token: token, user: user});
					});
				}
				else
				{
					const token = jwt.sign(user, config.secret, { expiresIn: config.auth.expirationTime.toString() });
					res.json({token: token, user: user});
				}		
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
	
	User.findOne({ studentnumber: parseInt(form.studentnumber) }, function (err, localUser) {
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
					text: 'Beste Leerling,\n\nDruk op deze link om jouw account aan te maken ' + config.site + '/#/auth/register/' + code + '\n\nMet vriendelijke groet,\n\nHet game tournament team'
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

	User.findOne({ studentnumber: studentNumber }, function (err, user) {
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
				text: 'Beste Leerling,\n\nDruk op deze link om jouw wachtwoord te resetten ' + config.site + '/#/auth/forgotPassword/' + code + '\n\nMet vriendelijke groet,\n\nHet game tournament team'
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

		User.findOne({ studentnumber: form.studentnumber }, function (err, localUser) {
			passwordReset.remove();

			apiCall({
				method: 'post',
				apiUrl: '/auth/changePassword',
				form: {
					email: form.studentnumber + '@mydavinci.nl',
					password: form.password,
					oldpassword: localUser.password
				}
			}, function (err, data) {
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

		apiCall({
			method: 'post',
			apiUri: '/auth/register',
			form: {
				email: form.studentnumber + '@mydavinci.nl',
				password: form.password
			}
		}, function (err, data) {
			if (data.err) {
				res.json({ err: data.err });
				return;
			}

			const localUser = new User(data.user);
			localUser.firstname = form.firstname;
			localUser.lastname = form.lastname;
			localUser.studentnumber = parseInt(form.studentnumber);

			apiCall({
				method: 'post',
				apiUri: '/auth/login',
				form: {
					email: form.studentnumber + '@mydavinci.nl',
					password: form.password
				}
			}, function (err, data) {
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