'use strict';
var babelify = require('babelify');
var browserify = require('browserify');
var escapeStringRegexp = require('escape-string-regexp');
var getFileName = require('./get-file-name');
var getLintifyOptions = require('./get-lintify-options');
var lintify = require('lintify');
var lodash = require('lodash');
var log = require('./log');
var path = require('path');
var uglify = require('./uglify');

function logError(error) {
    if (0 !== error.message.indexOf('ESLint')) {
        console.error(error.stack);
    }
}

function initialize(value, key, deferred, config) {
    var fileName = getFileName(key, config.source);
    var lintifyOptions = getLintifyOptions(key);
    var appString = '[\\/]node_modules[\\/](?!' + escapeStringRegexp(config.app) + '[\\/])';
    var appExpression = new RegExp(appString);
    var bundle;
    var external;

    function build(action) {
        var startTime = Number(new Date());

        function onError(error) {
            logError(error);
            deferred.reject(error);
        }

        function onResolved() {
            var endTime = Number(new Date());
            var performance = (endTime - startTime) + ' ms' ;
            log([action, [key, 'magenta'], 'bundle in', performance]);
            deferred.resolve();
        }

        function onRejected(reason) {
            console.error(reason);
            deferred.reject(reason);
        }

        function onBundle(error, buffer) {
            if (error) {
                onError(error);
            } else {
                uglify(key, config.target, String(buffer))
                    .then(onResolved)
                    .then(null, onRejected);
            }
        }

        bundle
            .bundle(onBundle)
            .on('error', onError);
    }

    external = lodash.union(
        lodash(config.vendors)
            .map(function (item) {
                return item;
            })
            .flatten()
            .value(),
        value.external
    );

    bundle = browserify(fileName, {
        debug: true,
        extensions: [
            '.jsx'
        ]
    })
        .require(value.require || [])
        .external(external)
        //.transform(lintify, lintifyOptions)
        .transform(babelify.configure({
            sourceMapRelative: process.cwd(),
            ignore: appExpression
        }), {
            global: true
        });
    return build;
}

module.exports = initialize;
