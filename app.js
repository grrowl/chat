var express = require('express'),
    debug = require('debug')('pockychat'),
    path = require('path'),
    Primus = require('primus'),
    Rooms = require('primus-rooms'),
    logger = require('morgan'),
    now = require("performance-now");

var app = express();

// config
app.set('port', process.env.PORT || 3000);

// server setup
var server = app.listen(app.get('port'), function() {
        debug('pockychat listening on port ' + server.address().port);
  console.log('pockychat listening on port ' + server.address().port);
});

primus = new Primus(server, { transformer: 'engine.io' });

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(require('node-compass')({
  mode: 'expanded',
  logging: true,
  project: path.join(__dirname, 'public'),
  css: 'css',
  sass: 'css'
}));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
  res.render('index', { title: 'pockychat' });
});

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


// Primus setup

// add rooms to Primus
primus.use('rooms', Rooms);

primus.on('connection', function (spark) {
  spark.on('data', function(data) {

    data = data || {};
    var action = data.action;
    var room = data.room;

    switch (action) {
      case 'join':
        spark.join(room, function () {
          // send message to this client
          spark.write('you joined room ' + room);

          // send message to all clients except this one
          spark.room(room).except(spark.id).write(spark.id + ' joined room ' + room);

        });
        break;

      case 'leave':
        spark.leave(room, function () {
          // send message to this client
          spark.write('you left room ' + room);
        });
        break;

      case 'message':
        data.source = spark.id;
        data.date = now();

        // to everyone
        spark.room(room).except(spark.id).write(data);
        // to sender
        spark.write(data);
        break;

      default:
        spark.write('Invalid action');
        console.log('invalid action', JSON.stringify(data));
    }

  });

});
