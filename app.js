'use strict';

const express = require('express');
const app = express();

const mongoose = require('mongoose');

const config = require('./config');

app.get('/', function(req, res) {
	res.send('Hello World!');
});

app.listen(config.port, function() {
	console.log('Server is running on port ' + config.port);
});