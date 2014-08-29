
// Supporting libraries
// var file = require('gulp-file');

var Primus = require('primus');
var Rooms = require('primus-rooms');
var now = require('performance-now');
var merge = require('react/lib/merge');

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

    });

  });

}

