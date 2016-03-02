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
	
	res.json({ msg: 'There is sent an email to ' + form.studentnumber + '@mydavinci.nl' });
});

module.exports = router;