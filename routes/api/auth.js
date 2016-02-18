'use strict';

const express = require('express');
const router = express.Router();
const paramCheck = require('../../middleware/requiredPostParams');

router.post('/register', paramCheck(['email', 'password']), function (req, res) {
	res.end();
});

module.exports = router;