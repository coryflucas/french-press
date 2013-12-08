var fs = require('fs');
var path = require('path');
var fm = require('front-matter');
var async = require('async');

function PostRepo(postsDir, permLinkFunction, useCache) {
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
    };

    this.getPost = function (permLink, callback) {
        readPosts(function (err, posts) {
            callback(err, err ? null : getMatchingPost(posts, permLink));
        });
    };

    var getMatchingPost = function (posts, permLink) {
        var matchingPosts = posts.filter(function (p) {
            return p.attributes.link === permLink;
        });
        return matchingPosts.length > 0 ? matchingPosts[0] : null;
    };

    // Wrapper around reading posts to handle caching
    var readPosts = function(callback) {
        if (useCache && _posts) {
            callback(null, _posts);
            return;
        }

        doReadPosts(function(err, posts) {
            if(useCache && !err) {
                _posts = posts;
            }
            callback(err, posts);
        });
    };

    var doReadPosts = function (callback) {
        async.waterfall([
            function(next) {
                fs.readdir(postsDir, next);
            },
            function(fileNames, next) {
                async.map(fileNames.map(getAbsolutePath), fs.readFile, next);
            },
            function(files, next) {
                var posts = files.map(parsePost).filter(notNull).sort(byDate);

                // create next/prev metadata
                for (var p = 0; p < posts.length; p++) {
                    if (p > 0) {
                        posts[p].next = stripBody(posts[p - 1]);
                    }
                    if (p < posts.length - 1) {
                        posts[p].previous = stripBody(posts[p + 1]);
                    }
                }

                next(null, posts);
            }
        ], callback);
    };

    var getAbsolutePath = function(postPath) {
        return path.join(postsDir, postPath);
    };

    var parsePost = function (fileContents) {
        var post = parseFrontMatter(fileContents.toString());
        if (post) {
            post.body = parseBody(post.body);
            if (!post.attributes.link) {
                post.attributes.link = buildPermLink(post);
            }
        }
        return post;
    };

    var parseFrontMatter = function (fileContents) {
        // quick check for front-matter, skip the file if its missing
        if (fileContents.slice(0, 3) !== '---') {
            return null;
        }
        return fm(fileContents);
    };

    var parseBody = function (body) {
        var md = require('markdown');
        return md.parse(body);
    };

    var notNull = function(x) {
        return x;
    };

    var byDate = function (a, b) {
        return (new Date(b.attributes.date)) - (new Date(a.attributes.date));
    };

    var stripBody = function(post) {
        return {
            attributes: post.attributes
        };
    };

    var buildPermLink = function(post) {
        return permLinkFunction(post.attributes);
    };
}

module.exports = PostRepo;
