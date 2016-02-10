'use strict';

var express = require('express');
var app = express();

app.get('/', function (req, res) {
    res.send('dit is nu verandert enhoer1');
});

app.listen(process.env.PORT || 1337, function () {
    console.log('Server is running!');
});