'use strict';
var jshint = require('jshint').JSHINT;
var lintrc = require('./lintrc');
var log = require('./log');
var path = require('path');
var through2 = require('through2');

var MAGIC_NUMBER = 7;
var globals = {
    console: false
};

function bufferFactory(file, bundle) {
    function setBuffer(buffer, encoding, next) {
        var source = buffer.toString('utf8');

        if ('production' == process.env.NODE_ENV) {
            lintrc.debug = false;
            lintrc.devel = false;
        }

        jshint(source, lintrc, globals);

        if (jshint.errors.length) {
            log(['errored', [file, 'cyan']]);

            jshint.errors.forEach(function (error) {
                var location = [error.line, error.character].join(':');

                while (location.length < MAGIC_NUMBER) {
                    location = ' ' + location;
                }

                log([location, [error.reason, 'red']]);
            });

            log(['aborted', [bundle, 'magenta'], 'bundle']);
            this.emit('error', {
                message: 'JSHint error'
            });
        }

        this.push(source);
        next();
    }

    return setBuffer;
}

function lint(modulePath, options) {
    var stream;
    var filePath = path.relative(process.cwd(), modulePath);
    stream = through2(bufferFactory(filePath, options.bundle));
    return stream;
}

module.exports = lint;
