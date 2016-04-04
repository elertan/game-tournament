'use strict';

const express = require('express');
const router = express.Router();

router.use('/auth', require('./spa/auth'));
router.use('/groups', require('./spa/groups'));
router.use('/users', require('./spa/users'));

router.get('/index', function (req, res) {
	res.render('spa/index');
});

router.get('/about', function (req, res) {
	res.render('spa/about');
});

module.exports = router;