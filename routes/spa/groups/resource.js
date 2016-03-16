'use strict';

const express = require('express');
const router = express.Router();

const isAuth = require('../../../middleware/isAuth');

const Group = require('../../../models/group'); // MOVE TO THE API, WE ARE IN THE SPA NOW THIS IS INCORRECT

// Get all
router.get('/', function (req, res) {
	// Group.find({}, function (err, groups) {
	// 	res.json(groups);
	// });
});

// Create
router.post('/', isAuth, function (req, res) {
	const form = req.body;
	
	
});

// Read
router.get('/:id', function (req, res) {
	
});

// Update
router.put('/:id', isAuth, function (req, res) {
	const form = req.body;
	
});

// Delete
router.delete('/:id', isAuth, function (req, res) {
	
});

module.exports = router;