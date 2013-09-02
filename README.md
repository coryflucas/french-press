Frech Press
===========

## What Is It?
Inspired by [Jekyll](http://jekyllrb.com/) and [Typeset](https://github.com/typeset/typeset), French Press is a simple
[Markdown](http://daringfireball.net/projects/markdown/) based middleware module for [Express](http://expressjs.com/).
The source is licensed under the MIT license and available on the
[GitHub Page](https://github.com/coryflucas/french-press).

## Getting Started
### Install the module
French Press works with the [Express](http://expressjs.com/) framework.  To start using it with your existing Express
application install the module via [npm](https://npmjs.org/):

    $ npm install french-press

### Configure middleware
Now create a folder in your project for holding your posts, and configure and attache the middleware module to your
Express application:

    var express = require('express');
    var fp = require('french-press');
    ...
    var app = express();
    ...
    app.use('/blog/', fp.blog(
      {
        postsDir: __dirname + '/posts',
        listTemplate: 'blogListTemplate',
        postTemplate: 'blogPostTemplate'
      }));

### Create your templates
French Press requires two templates to be created, one for the listing of posts, and one for the display of a single
post. The templates can be written in any of the template engines you have setup Express to work with. See the
[wiki](https://github.com/coryflucas/french-press/wiki) for more information on configuring your templates.

### Start writing posts
All you need to do now is create some posts.  Posts are written in Markdown with font-matter headers (title and date are
required).  Here's a basic example:

    ---
    title: Hello World
    date: 2013-09-01 13:00:00
    ---
    # First Post!

New posts and changes to existing posts are automatically detected, and will immediately be available.  Perma-links
default to the posts title, but can be overridden when configuring the middleware.

## Additional Info
Check out the [GitHub Page](https://github.com/coryflucas/french-press) for the source and more information.
