
// Supporting libraries


var url = require('url');
var http = require('http');
var $ = require('gulp-load-plugins')();

var Primus = require('primus');
var Rooms = require('primus-rooms');
var now = require('performance-now');
var merge = require('react/lib/merge');

var _port = 3000;

var _assetRoot;
var _primus, _server;

function bindStatic(server) {
  var staticHandler = require('ecstatic')({
    root: './', cache: 'no-cache', showDir: true
  });

  _server.on('request', function (req, res) {
    // For non-existent files output the contents of /index.html page in order to make HTML5 routing work
    var urlPath = url.parse(req.url).pathname;
    if (urlPath === '/') {
      req.url = _assetRoot.substring(1) + '/index.html';
    } else if (['src', 'bower_components'].indexOf(urlPath.split('/')[1]) === -1) {
      if (urlPath.length > 3 &&
        ['src', 'bower_components'].indexOf(urlPath.split('/')[1]) === -1 &&
        ['css', 'html', 'ico', 'js', 'png', 'txt', 'xml'].indexOf(urlPath.split('.').pop()) == -1 &&
        ['fonts', 'images', 'vendor', 'views'].indexOf(urlPath.split('/')[1]) == -1) {
        req.url = _assetRoot.substring(1) + '/index.html';
      } else {
        req.url = _assetRoot.substring(1) + req.url;
      }
    }
    staticHandler(req, res);
  });
}

function bindChat(server) {

  // Hook into server
  var primus = require('primus')(server, {
      transformer: 'engine.io'
  });

  // add rooms to Primus
  primus.use('rooms', Rooms);

  // Handle new connection and new data
  primus.on('connection', function (spark) {
    $.util.log('[chat] connection: ' + $.util.colors.magenta(spark.id));

    spark.on('data', function(data) {
      onChatCommand(spark, data);
    });
  });
}

function onChatCommand(spark, data) {
  var action = data.action,
      message = data.data,
      room = message.room;

  switch (action) {
    case 'join':
      spark.join(room, function () {
        // send message to this client
        // spark.write('you joined room ' + room);
        spark.write({
          action: 'join',
          data: room
        });

        // send message to all clients except this one
        spark.room(room).except(spark.id).write(spark.id + ' joined room ' + room);

      });
      break;

    case 'leave':
      spark.leave(room, function () {
        // send message to this client
        // spark.write('you left room ' + room);
        spark.write({
          action: 'leave',
          data: room
        });
      });
      break;

    case 'message':
      message.source = spark.id;
      message.serverDate = now();

      // send back to sender
      spark.write({
        action: 'message',
        data: message
      });

      // unset clientDate, for security and terseness
      message.clientDate = undefined;

      // send to everyone
      spark.room(room).except(spark.id).write({
        action: 'message',
        data: message
      });

      break;

    case 'system': // server should never receive this
      spark.write('Naughty!');
      break;

    default:
      spark.write('Invalid action');
      console.log('invalid action', JSON.stringify(data));
  }
}

module.exports = function (opts) {
  var nextCallback = opts.afterStart || function () {};

  _assetRoot = opts.assetRoot || './build';

  _server = http.createServer();

  // Bind static asset server
  bindStatic(_server);

  // Bind chat server
  bindChat(_server);

  _server.listen(_port, function () {
    $.util.log('Server is listening on ' + $.util.colors.magenta('http://localhost:' + _port + '/'));
    nextCallback();
  });

};
