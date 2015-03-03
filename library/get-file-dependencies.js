'use strict';
var async = require('async');
var browserResolve = require('browser-resolve');
var detective = require('detective');
var fs = require('fs');
var path = require('path');

/**
 * @param {string} inputFile
 * @returns {Promise}
 */
function getFileDependencies(inputFile) {
    var promise;

    function walk(file, callback) {
        file = path.resolve(file);
        fs.readFile(file, 'utf8', read);

        function read(error, contents) {
            var requires;

            if (error) {
                return callback(error);
            }

            requires = detective(contents);
            async.map(requires, getDependencies, gotDependencies);
        }

        function getDependencies(name, callback) {
            browserResolve(name, {
                filename: file
            }, resolved);

            function resolved(error, p) {
                if (error) {
                    return callback(error);
                }

                return walk(p, callback);
            }
        }

        function gotDependencies(error, dependencies) {
            if (error) {
                return callback(error);
            }

            dependencies.push(path.relative(process.cwd(), file));
            callback(null, dependencies.concat.apply([], dependencies));
        }
    }

    function executor(resolve, reject) {
        function done(error, data) {
            if (error) {
                reject(error);
            }

            resolve(data);
        }

        walk(inputFile, done);
    }

    promise = new Promise(executor);
    return promise;
}

module.exports = getFileDependencies;