"use strict";

var http = require('http');
var querystring = require('querystring');
var Handlebars = require('handlebars');
var fs = require('fs');

module.exports = function () {
  // YOUR CODE HERE
  var responseCallback = {};

  var server = http.createServer(function(req, res) {
    res.send = function(response) {
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end(response);
    }

    res.json = function(obj) {
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end(JSON.stringify(obj));
    }

    res.render = function(fileName, options) {
      res.writeHead(200, {'Content-Type': 'text/html'});
      var hbs = require('./views/' + fileName);
      if (fs.existsSync('./views/layouts/main.hbs')) {
        var main = require('./views/layouts/main.hbs');
        var pageToRender = {'body': hbs(options)};
        res.end(main(pageToRender));
      } else {
        res.end(hbs(options));
      }
    }

    if (req.method === 'POST') {
      var body = '';
      req.on('readable', function() {
        var chunk = req.read();
        if (chunk) body += chunk;
      });
      req.on('end', function() {
        req.body = querystring.parse(body);
        if (! responseCallback[req.url]) {
          res.end('404: Route does not exist post');
        } else {
          responseCallback[req.url]['POST'](req, res);
        }
      });
    }

    if (req.method === 'GET') {
      var index = 0;
      var url = req.url;

      // deals with params
      var slash = req.url.split('/');
      for (var key in responseCallback) {
        var dividedURL = key.split('/');
        var bool = true;
        dividedURL.forEach((word, index) => {
          if (slash.length !== dividedURL.length) {
            bool = false;
          }
          if (word.indexOf(':') === -1 && slash[index] !== word) {
            bool = false;
          }
        })
        if (bool) {
          url = key;
          var obj = {};
          dividedURL.forEach((word, index) => {
            if (word.indexOf(':') === 0) {
              obj[word.slice(1, word.length)] = slash[index];
            }
          })
          req.params = obj;
        }
      }

      // deals with query
      // parse url from whole url + query: /query?hello=92 -> url: /query
      if (req.url.indexOf('?') !== -1) {
        index = req.url.indexOf('?');
        url = req.url.slice(0, index);
      }

      // runs the route that matches the requested route
      if (! responseCallback[url]) {
        res.end('404: Route does not exist get');
      } else if (index) {
        var qString = req.url.slice(index + 1, req.url.length);
        req.query = querystring.parse(qString);
        responseCallback[url]['GET'](req, res);
      } else {
        responseCallback[url]['GET'](req, res);
      }
    }
  });

  return {
    get: function(route, callback) {
      if (! responseCallback[route]) {
        responseCallback[route] = {'GET': callback};
      } else if (!  responseCallback[route]['GET']) {
        responseCallback[route]['GET'] = callback;
      }
    },
    post: function(route, callback) {
      if (! responseCallback[route]) {
        responseCallback[route] = {'POST': callback};
      } else if (! responseCallback[route]['POST']) {
        responseCallback[route]['POST'] = callback;
      }
    },
    use: function(routePrefix, callback) {
      if (! responseCallback[routePrefix]) {
        responseCallback[routePrefix] = {'POST': callback};
        responseCallback[routePrefix]['GET'] = callback;
      } else if (! responseCallback[routePrefix]['GET']) {
        responseCallback[routePrefix]['GET'] = callback;
      } else if (! responseCallback[routePrefix]['POST']) {
        responseCallback[routePrefix]['POST'] = callback;
      }
    },
    listen: function(port) {
      server.listen(port);
    }
  };
};
