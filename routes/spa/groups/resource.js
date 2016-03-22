'use strict';

const request = require('request');

const express = require('express');
const router = express.Router();

const isAuth = require('../../../middleware/isAuth');

// Get all
router.get('/', function (req, res) {
	request.get({
		url: config.apiServer + '/groups'
	}, function (err, httpRes, body) {
		if (err) {
			res.status(500);
			return;
		}

		const data = JSON.parse(body);
		res.json(data);
	});
});

// Create
router.post('/', isAuth, function (req, res) {
	res.status(200);
});

// Read
router.get('/:id', function (req, res) {
	res.status(200);
});

// Update
router.put('/:id', isAuth, function (req, res) {
	const form = req.body;
	res.status(200);
});

// Delete
router.delete('/:id', isAuth, function (req, res) {
	res.status(200);
});

module.exports = router;