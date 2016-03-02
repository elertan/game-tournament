'use strict';

const express = require('express');
const router = express.Router();

router.use('/auth', require('./spa/auth'));

router.get('/index', function (req, res) {
	res.render('spa/index');
});

module.exports = router;