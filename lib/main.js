'use strict';
var os = require('os');
var fs = require('fs');
var path = require('path');
var Minimatch = require('minimatch').Minimatch;

var hook = process.env.npm_lifecycle_event;

if (!hook && process.argv.length >= 3)
    hook = process.argv[2];

if (!hook)
    throw new Error('no npm event specified');

//shim Buffer.indexOf
if (typeof Buffer.prototype.indexOf === 'undefined') {
    Buffer.prototype.indexOf = function(val) {
        for (var i = 0; i < this.length; i++) {
            if (this[i] === val)
                return i;
        }
        return -1;
    }
}

var READ_SIZE = 8000;

var miniMatchOptions = { matchBase: true, dot: true, flipNegate: true };
var ignoreMinimatches = [];
//always ignore these files
ignoreMinimatches.push(new Minimatch('.git', miniMatchOptions));
ignoreMinimatches.push(new Minimatch('.hg', miniMatchOptions));
ignoreMinimatches.push(new Minimatch('.svn', miniMatchOptions));
ignoreMinimatches.push(new Minimatch('CVS', miniMatchOptions));
ignoreMinimatches.push(new Minimatch('package.json', miniMatchOptions));
ignoreMinimatches.push(new Minimatch('node_modules', miniMatchOptions));

switch (hook.toLowerCase()) {
    case 'prepublish':
        if (os.EOL === '\n')
            return;
        convert('\n');
        break;

    case 'postpublish':
        if (os.EOL === '\r\n')
            return;
        convert(os.EOL);
        break;
}

var replaceEol;
function convert(eol) {
    switch (eol) {
        case '\n':
            replaceEol = function(input) {
                return input.replace(/\r\n/g, '\n');
            };
            break;
        case '\r\n':
            replaceEol = function(input) {
                return input.replace(/(\r)?\n/g, function ($0, $1) { //emulate negative look-behind
                    return $1 ? $0 : '\r\n';
                });
            };
            break;
        default:
            throw new Error('unknown EOL');
    }

    fs.readFile('.npmignore', {encoding: 'utf8'}, function (err, data) {
        if (!err) {
            parseIgnoreFile(data);
            convertDirectory('./');
            return;
        }

        fs.readFile('.gitignore', {encoding: 'utf8'}, function (err, data) {
            if (!err)
                parseIgnoreFile(data);

            convertDirectory('./');
        });
    });
}

function parseIgnoreFile(data) {
    var patterns = data.split(/\r?\n/);

    for (var i = 0; i < patterns.length; i++) {
        var pattern = patterns[i];
        if (pattern || pattern.charAt(0) !== '#') { //ignore empty lines and comments
            ignoreMinimatches.push(new Minimatch(pattern, miniMatchOptions));
        }
    }
}

function convertDirectory(dirPath) {
    //get file in the dir
    fs.readdir(dirPath, function(err, files) {
        if (!!err)
            return error(err);

        files.forEach(function(fileName) {
            var filePath = path.join(dirPath, fileName);

            fs.stat(filePath, function(err, stats) {
                if (!!err)
                    return error(err);

                if (stats.isDirectory()) {
                    if (!includeFile(filePath, true))
                        return;

                    convertDirectory(filePath);
                } else {
                    if (!includeFile(filePath, false))
                        return;

                    checkFile(filePath, stats);
                }
            });
        });
    });
}

function checkFile(filePath, stats) {
    var buf;

    fs.open(filePath, 'r', function (err, fd) {
        if (!!err)
            return error(err);

        if (stats.size === 0)
            return;

        //detect if the file is binary using the same method as GIT
        //if the first 8000 bytes contains a null byte, assume it's a binary file
        var readLength = Math.min(stats.size, READ_SIZE);
        buf = new Buffer(readLength);

        fs.read(fd, buf, 0, readLength, 0, function(err, bytesRead) {
            if (!!err)
                return error(err);

            buf = buf.slice(0, bytesRead);

            if (buf.indexOf(0x00) > -1) {
                //console.log('skipping ' + filePath);

                fs.close(fd, function (err) {
                    if (!!err)
                        return error(err);
                });
                return;
            }

            //already read the whole file, so just convert it
            if (stats.size <= bytesRead) {
                fs.close(fd, function(err) {
                    if (!!err)
                        return error(err);
                });

                convertFile(filePath, stats, buf);
                return;
            }

            //need to read the rest of the file
            var buf2 = new Buffer(stats.size);
            buf.copy(buf2, 0, 0, buf.length);

            fs.read(fd, buf2, bytesRead, stats.size - bytesRead, bytesRead, function(err, bytesRead2) {
                if (!!err)
                    return error(err);

                if (bytesRead + bytesRead2 !== stats.size)
                    throw new Error('failed to read whole file');

                fs.close(fd, function(err) {
                    if (!!err)
                        return error(err);
                });

                convertFile(filePath, stats, buf2);
            });
        });
    });
}

//This code is mostly taken fstream-ignore. Thanks!
function includeFile(filePath, partial) {
    var included = true;

    ignoreMinimatches.forEach(function (rule) {
        var match = rule.match("/" + filePath);

        if (!match)
            match = rule.match(filePath);

        if (!match && partial)
            match = rule.match("/" + filePath + "/") || rule.match(filePath + "/");

        if (!match && rule.negate && partial)
            match = rule.match("/" + filePath, true) || rule.match(filePath, true);

        if (match)
            included = rule.negate;
    });

    return included;
}


function convertFile(filePath, stats, buf) {
    var str = buf.toString('utf8');
    str = replaceEol(str);

    fs.writeFile(filePath, str, { encoding: 'utf8' }, function (err) {
        if (!!err)
            return error(err);

        fs.utimes(filePath, stats.atime, stats.mtime, function (err) {
            if (!!err)
                return error(err);
        });
    });
}

function error(err) {
    console.error(err);
    process.exit(1);
}