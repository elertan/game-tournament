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

router.get('/show', function (req, res) {
	res.render('spa/groups/show');
});

router.get('/manage', function (req, res) {
	res.render('spa/groups/manage');
});

router.get('/chat', function (req, res) {
	res.render('spa/groups/chat');
});

module.exports = router;