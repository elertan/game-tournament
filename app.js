'use strict';

const express = require('express');
const app = express();

app.get('/', function(req, res) {
    res.send('Hello World!');
});

app.listen(process.env.PORT || 1337, function() {
    console.log('Server is running!');
});