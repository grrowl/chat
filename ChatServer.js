
// Supporting libraries


var url = require('url');
var http = require('http');
var formidable = require('formidable');
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
    var urlPath = url.parse(req.url).pathname;

    if (urlPath === '/upload') {
      return; // let bindUploads take it

    } else if (urlPath === '/') {
      req.url = _assetRoot.substring(1) + '/index.html';

    } else {
      req.url = _assetRoot.substring(1) + req.url;
    }
/*
    // For non-existent files output the contents of /index.html page in order to make HTML5 routing work
    // disabled for now, we should whitelist html5 routes instead of the below mess
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
*/
    staticHandler(req, res);
  });
}

function bindUploads(server) {
  server.on('request', function (req, res) {
    if (url.parse(req.url).pathname !== '/upload' || req.method.toLowerCase() !== 'post')
      return;

    var form = new formidable.IncomingForm();
    form.encoding = 'binary';

    form.on('file', function (name, file) {
      $.util.log('[uploads] onfile: ' + $.util.colors.magenta(name));
      $.util.log('[uploads] onfile: ' + $.util.colors.magenta(JSON.stringify(file)));
    });

    form.parse(req, function(err, fields, files) {
      emitSystemMessage('an upload happened');

      if (err)
        $.util.log('[uploads] error: ' + $.util.colors.red(JSON.stringify(err)));
      $.util.log('[uploads] happened: ' + $.util.colors.magenta(JSON.stringify(fields)));

      res.writeHead(200, {'content-type': 'text/plain'});
      res.write('received upload:\n\n');
      res.end();
      // res.end($.util.inspect({fields: fields, files: files}));
    });


    // https://github.com/fluent-ffmpeg/node-fluent-ffmpeg
  });
}

function bindChat(server) {

  // Hook into server
  _primus = require('primus')(server, {
    transformer: 'engine.io'
  });

  // add rooms to Primus
  _primus.use('rooms', Rooms);

  // Handle new connection and new data
  _primus.on('connection', function (spark) {
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

  $.util.log('[chat] '+ $.util.colors.magenta(action) +' from ' + $.util.colors.green(spark.id));

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

// Notify everyone of a system message
function emitSystemMessage(message) {
  _primus.write({
    action: 'message',
    data: {
      serverDate: now(),
      source: 'system',
      room: 'system',
      text: message,
    }
  });
}

module.exports = function (opts) {
  var nextCallback = opts.afterStart || function () {};

  _assetRoot = opts.assetRoot || './build';

  _server = http.createServer();

  // Bind static asset server
  bindStatic(_server);

  // Bind upload handler
  bindUploads(_server);

  // Bind chat server
  bindChat(_server);

  _server.listen(_port, function () {
    $.util.log('Server is listening on ' + $.util.colors.magenta('http://localhost:' + _port + '/'));
    nextCallback();
  });

};
