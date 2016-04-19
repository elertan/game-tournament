'use strict';

const express = require('express');
const router = express.Router();

const config = require('../../config');

router.use('/resource', require('./inbox/resource'));

// Add routes here
router.get('/', function (req, res) {
	res.render('spa/inbox');
});

router.get('/show', function (req, res) {
	res.render('spa/inbox/show');
});

router.get('/create', function (req, res) {
	res.render('spa/inbox/create');
});

module.exports = router;