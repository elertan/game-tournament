'use strict';

const express = require('express');
const router = express.Router();

// Add routes here
router.get('/login', function (req, res) {
	res.render('spa/auth/login');
});

module.exports = router;