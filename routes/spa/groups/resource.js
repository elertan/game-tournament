'use strict';

const express = require('express');
const router = express.Router();

const isAuth = require('../../../middleware/isAuth');
const apiCall = require('../../../modules/apiCall');

// Get all
router.get('/', function (req, res) {
	apiCall({
		method: 'get',
		apiUri: '/groups'
	}, function (err, data) {
		if (err) {
			res.status(500);
			return;
		}
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