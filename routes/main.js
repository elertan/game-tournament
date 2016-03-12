'use strict';

const express = require('express');
const router = express.Router();

router.use('/public', express.static(__dirname + '/../bower_components'));
router.use('/public', express.static(__dirname + '/../public'));
router.use('/api', require('./api'));
router.use('/spa', require('./spa'));

router.get('/', function (req, res) {
	// SPA
	res.render('index');
});

module.exports = router;