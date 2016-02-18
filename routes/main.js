'use strict';

const express = require('express');
const router = express.Router();

router.use('/public', express.static(__dirname + '/../bower_components'));
router.use('/api', require('./api'));

router.get('/', function(req, res) {
	res.send('Hello World!');
});

module.exports = router;