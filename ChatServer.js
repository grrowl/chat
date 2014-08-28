
// Supporting libraries
// var file = require('gulp-file');

var Primus = require('primus');
var Rooms = require('primus-rooms');

module.exports = function (server) {

  // Hook into server
  var primus = require('primus')(server, {
      transformer: 'engine.io'
  });

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

        case 'system': // server should never receive this
          spark.write('Naughty!');
          break;

        default:
          spark.write('Invalid action');
          console.log('invalid action', JSON.stringify(data));
      }

    });

  });

}

