var fs = require('fs');
var path = require('path');
var fm = require('front-matter');
var async = require('async');

module.exports = function (postsDir, permLinkFunction, useCache) {
    var _posts;

    if (!useCache) {
        console.log('WARNING: not using cache!');
    }

    fs.watch(postsDir, { persistent: false }, function () {
        // flush cache on changes
        if (useCache && _posts) {
            _posts = null;
        }
    });

    this.findPosts = function (count, offset, callback) {
        readPosts(function (err, posts) {
            callback(err, err ? null : posts.slice(offset, offset + count));
        });
    }

    this.getPost = function (permLink, callback) {
        readPosts(function (err, posts) {
            callback(err, err ? null : getMatchingPost(posts, permLink));
        });
    }

    var getMatchingPost = function (posts, permLink) {
        var matchingPosts = posts.filter(function (p) {
            return p.attributes.link === permLink;
        });
        return matchingPosts.length > 0 ? matchingPosts[0] : null;
    }

    var readPosts = function (callback) {
        if (useCache && _posts) {
            callback(null, _posts);
            return;
        }

        fs.readdir(postsDir, function (err, files) {
            if (err) {
                callback(err);
            } else {
                files = files.map(function (f) {
                    return path.join(postsDir, f);
                });

                async.map(files, fs.readFile, function (err, postFiles) {
                    if (err) {
                        callback(err);
                    } else {
                        var posts = postFiles.map(parsePost).filter(function (post) {
                            return post;
                        });

                        posts = posts.sort(function (a, b) {
                            return (new Date(b.attributes.date)) - (new Date(a.attributes.date));
                        });
                        for (var p = 0; p < posts.length; p++) {
                            if (p > 0) {
                                posts[p].next = { attributes: posts[p - 1].attributes };
                            }
                            if (p < posts.length - 1) {
                                posts[p].previous = { attributes: posts[p + 1].attributes };
                            }
                            if (!posts[p].attributes.link) {
                                try {
                                    posts[p].attributes.link = permLinkFunction(posts[p].attributes);
                                } catch (err) {
                                    var msg = 'Error calling permLinkFunction for ' + files[p];
                                    if(typeof err === Error) {
                                        err.message = msg + ': ' + err.message;
                                    }
                                    else {
                                        err = new Error(msg + ': ' + err);
                                    }
                                    callback(err);
                                    return;
                                }
                            }
                        }

                        if (useCache) {
                            _posts = posts;
                        }

                        callback(null, posts);
                    }
                });
            }
        });
    }

    var parsePost = function (fileContents) {
        var content = parseFrontMatter(fileContents.toString());
        if (content)
            content.body = parseBody(content.body);
        return content;
    }

    var parseFrontMatter = function (fileContents) {
        // quick check for front-matter, skip the file if its missing
        if (fileContents.slice(0, 3) !== '---') {
            return null;
        }
        return fm(fileContents);
    }

    var parseBody = function (body) {
        var md = require('markdown');
        return md.parse(body);
    }
}

