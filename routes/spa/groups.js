'use strict';

const express = require('express');
const router = express.Router();

router.get('/', function (req, res) {
	res.render('spa/groups/index');
});

module.exports = router;