'use strict';

const express = require('express');
const router = express.Router();

const mailgun = require('mailgun-js')({ apiKey: 'key-95c69f24df3cf38a009998e4dcc8bb24', domain: 'sandbox18d026f44d7d4065b80d49564681004e.mailgun.org' });

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
	
	if (form.studentnumber.length != 8) {
		res.json({ err: 'Studentnumber must have 8 numbers' });
		return;
	}
	
	const data = {
		from: 'info@gametournament.nl',
		to: form.studentnumber + '@mydavinci.nl',
		subject: 'Account Activatie',
		text: 'Beste Leerling,\n\nDruk op deze link om jouw account aan te maken http://localhost:1337/#/auth/register/Adu342hda8asdm\n\nMet vriendelijke groet,\n\nHet game tournament team'
	};
	
	mailgun.messages().send(data, function (err, body) {
		if (!err) {
			res.json({ msg: 'suc6' });
		} else {
			res.json({ err: 'er!!!' });
		}
	});
});

module.exports = router;