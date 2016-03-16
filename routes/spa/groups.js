'use strict';

const express = require('express');
const router = express.Router();

router.use('/resource', require('./groups/resource'));

router.get('/', function (req, res) {
	res.render('spa/groups/index');
});

router.get('/create', function (req, res) {
	res.render('spa/groups/create');
});

module.exports = router;