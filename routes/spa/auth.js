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
	// Store the current time
	var now = new Date(new Date() + 60 * 60000); // + 60 * 60000
	
	// Find an existing blocked user login based on the ip address
	BlockedUserLogin.findOne({ blockedIp: req.connection.remoteAddress }, function (err, blockedUserLogin) {
		// There doesnt exist a blocked user login for this ip
		if (!blockedUserLogin || blockedUserLogin.timesFailed < config.auth.blockedLoginMaxTries || (blockedUserLogin.blockedTillDate && blockedUserLogin.blockedTillDate.getTime() < now.getTime())) {

			const password = form.password;
			const studentNumber = form.studentnumber;
			
			// Studentnumber is a number
			if (isNaN(studentNumber)) {
				res.json({ err: 'Student nummer moet een getal zijn' });		
				return;
			}
			
			// Studentnumber is 8 numbers in length
			if (studentNumber.length != 8) {
				res.json({ err: 'Studentnummer moet 8 getallen zijn' });
				return;
			}

			// Find the user by the studentnumber
			User.findOne({ studentnumber: studentNumber }, function (err, user) {
				// User wasnt found
				if (!user) {
					// Respond with user not found
					res.json({ err: 'Incorrect studentnummer en/of wachtwoord' });
					return;
				}
				
				// Check if the password is correct
				user.validPassword(password, function (same) {
					// Password is incorrect
					if (!same) {
						if (!blockedUserLogin) {
							// create a blockedUserLogin with 1 fail
							blockedUserLogin = new BlockedUserLogin({ blockedIp: req.connection.remoteAddress, timesFailed: 1 });

							// Respond to the client with a wrong password
							res.json({ err: 'Incorrect studentnummer en/of wachtwoord' });
						} else {
							blockedUserLogin.timesFailed++;
							if (blockedUserLogin.blockedTillDate) {
								// Create next wait time
								var waitTime = (Math.pow(config.auth.blockedLoginIncremental, blockedUserLogin.timesFailed - config.auth.blockedLoginMaxTries - 1) || 1)  * (config.auth.blockedLoginInitialTime * 100);
								var blockEndDate = new Date(now.getTime() + waitTime);
								blockedUserLogin.blockedTillDate = blockEndDate;
							} else {
								res.json({ err: 'Incorrect studentnummer en/of wachtwoord, nog ' + ((config.auth.blockedLoginMaxTries - blockedUserLogin.timesFailed) + 1) + ' poging(en) tot je voor een bepaalde tijd niet kan inloggen' });
							}
						}
						// save it to the database
						blockedUserLogin.save();
						return;
					}
					
					const token = jwt.sign(user, config.secret);
					// SECOND PARAMETER
					// , { 
					// 	expiresIn: config.auth.expirationTime.toString() 
					// }
					res.json({ token: token, user: user });
				});
			});
			return;
		}
		
		// Create next wait time
		var waitTime = (Math.pow(config.auth.blockedLoginIncremental, blockedUserLogin.timesFailed - config.auth.blockedLoginMaxTries - 1) || 1)  * (config.auth.blockedLoginInitialTime * 100);
		
		if (blockedUserLogin.blockedTillDate && blockedUserLogin.blockedTillDate.getTime() > now.getTime()) {
			res.json({ err: 'U heeft te vaak een verkeerde inlog poging gehad, u kunt weer over ' + Math.ceil(waitTime / 60 / 100) + ' minuten proberen in te loggen' });
			return;
		}

		// Increment failure time
		blockedUserLogin.timesFailed++;

		// Set the blockEndDate if the fail amount is greater than the max
		if (blockedUserLogin.timesFailed > config.auth.blockedLoginMaxTries) {
			var blockEndDate = new Date(now.getTime() + waitTime);
			blockedUserLogin.blockedTillDate = blockEndDate;
		}
		
		// Give different messages depending on if the login is blocked or not
		if (blockedUserLogin.blockedTillDate) {
			res.json({ err: 'U heeft te vaak een verkeerde inlog poging gehad, u kunt weer over ' + Math.ceil(waitTime / 60 / 100) + ' minuten proberen in te loggen' });
		} else {
			res.json({ err: 'Incorrect studentnummer en/of wachtwoord, nog ' + ((config.auth.blockedLoginMaxTries - blockedUserLogin.timesFailed) + 1) + ' poging(en) tot je voor een bepaalde tijd niet kan inloggen' });
		}
		// Save the block data
		blockedUserLogin.save();
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