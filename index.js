/**
 * User: Cory Lucas
 * Date: 8/24/13
 * Time: 10:45 PM
 *
 * Express middleware module for hosting a simple blog backed by Markdown files.
 */

var postTemplate;
var listTemplate;
var repo;

var url = require('url');
var postRepo = require('./lib/post-repo');

exports.blog = function (options) {
    postTemplate = options.postTemplate;
    listTemplate = options.listTemplate;
    var permLinkFunction = options.permLinkFunction || function (fm) {
        return fm.title.replace(/\s/g, '_');
    };
    repo = new postRepo(options.postsDir, permLinkFunction);

    return function (req, res, next) {
        var urlParts = url.parse(req.url).pathname.split('/').filter(function (e) {
            return e;
        });
        switch (urlParts.length) {
            case 0:
                list(req, res);
                return;
            case 1:
                view(req, res, urlParts[0])
                return;
        }

        next();
    }
}

list = function (req, res) {

    var reqUrl = url.parse(req.url, true);
    var count = reqUrl.query.count || 10;
    var offset = reqUrl.query.offset || 0;

    repo.findPosts(count, offset, function(err, posts) {
        if (err) {
            console.log(err);
            res.send(500);
        } else {
            var postAttribs = posts.map(function (p) {
                return p.attributes;
            });
            res.render(listTemplate, {posts: postAttribs});
        }
    });
}

view = function (req, res, permLink) {
    repo.getPost(permLink, function(err, post) {
        if (err) {
            console.log(err);
            res.send(500);
        } else if(!post) {
            res.send(404);
        } else {
            res.render(postTemplate, post);
        }
    });
}