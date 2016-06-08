'use strict';

const fs = require('fs');
const co = require('co');

const OffensiveWord = require('../models/offensiveWord');

const Profane = require('profane');
const profane = new Profane();

function escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

function replaceAll(str, find, replace) {
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

profane.didInit = false;
profane.init = function(cb) {
    return new Promise((resolve, reject) => {
        co(function*() {
            var words = yield OffensiveWord.find({});

            // Add all offensive words
            for (var i = words.length - 1; i >= 0; i--) {
                if (!words[i].ignoredWord) {
                    profane.addWord(words[i].word, []);
                } else {
                    profane.removeWord(words[i].word);
                }
            }

            profane.didInit = true;
            resolve();
            cb();
        });
    });
};

profane.replaceWords = function(text, replacement) {
    var foundWords = profane.getWordCounts(text);
    console.log(foundWords);

    for (var key in foundWords) {
        if (!replacement) {
            var r = '';
            for (var i = 0; i < key.length; i++) {
                r += '*';
            }
            text = replaceAll(text, key, r);
        } else {
            text = replaceAll(text, key, replacement);
        }
    }

    return text;
};

profane.checkOffensiveWordsWithFile = (filename, cb) => {
    return new Promise((resolve, reject) => {
        co(function*() {
            const content = yield fs.readFile(filename);

            var data = JSON.parse(content);

            const words = yield OffensiveWord.find({});
            for (var i = 0; i < data.words.length; i++) {
                var wordFound = false;
                for (var x = 0; x < words.length; x++) {
                    if (data.words[i].word == words[x].word) {
                        wordFound = true;
                        break;
                    }
                }
                if (!wordFound) {
                    var word = new OffensiveWord();
                    word.word = data.words[i].word;
                    if (data.words[i].ignoredWord) {
                        word.ignoredWord = true;
                    }
                    yield word.save();
                }
            }
            resolve();
            cb();
        }).catch(err => {
            reject(err);
        });
    });
};

module.exports = profane;