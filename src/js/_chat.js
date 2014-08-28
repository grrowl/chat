// Chat interfacing library

(function () {

  var $ = require('jquery'),
      Webcam = require('./webcam');

  module.exports = {

    primus: undefined,

    // rooms we're in
    rooms: ['global', 'pockyboard'],

    // total message history in memory
    messages: [],

    // indexes of messages sent to the server and not received back yet
    unverifiedMessageIndexes: [],

    // Initialise the chat channel system
    init: function () {
      this.primus = new Primus();
      this.primus = Primus.connect(window.location.href);
      this.bindEvents();

      this.messages.push = function (message) {
        var newIndex = Array.prototype.push.call(this.messages, message);

        if (typeof message.date == 'undefined') {
          this.unverifiedMessageIndexes.push(newIndex - 1);
        }

        UI.refresh();
      };
    },

    // update connection status (connecting)
    updateStatus: function (status) {
      $('#status').text(status);
    },

    // Send message to room
    message: function (message, room) {
      var sendObject;
      if (!this.primus)
        return console.error('message', 'Not connected');

      sendObject = {
        action: 'message',
        room: room || 'global',
        clientDate: performance.now(),
        text: message,
        imageData: Webcam.snapshot().toDataURL('image/png') || ''
      };

      this.messages.push($.extend({}, sendObject, { received: false }));
      this.primus.write(sendObject);
    },

    // Join a room/channel
    join: function (room) {
      this.primus.write({ action: 'join', room: room });
    },

    // Leave a room/channel
    leave: function (room) {
      this.primus.write({ action: 'leave', room: room });
    },

    // Bind chat/protocol events
    bindEvents: function () {
      var self = this,
          primus = this.primus;

      primus.on('reconnecting', function reconnecting(opts) {
        console.warn('reconnecting', 'We are <strong>scheduling</strong> a new reconnect attempt. This is attempt <strong>'+ opts.attempt +'</strong> and will trigger a reconnect operation in <strong>'+ opts.timeout +'</strong> ms.');
        self.updateStatus('reconnecting');
      });

      primus.on('reconnect', function reconnect() {
        console.warn('reconnect', 'Starting the reconnect attempt, hopefully we get a connection!');
      });

      primus.on('online', function online() {
        console.log('online', 'We have regained control over our internet connection.');
      });

      primus.on('offline', function offline() {
        console.log('offline', 'We lost our internet connection.');
      });

      primus.on('open', function open() {
        console.log('open', 'The connection has been established.');
        self.updateStatus('connected');

        // (re-)join our rooms
        self.join(self.rooms.join(' '), function () {
          console.log('init', 'joined rooms '+ self.rooms);
        });
      });

      primus.on('error', function error(err) {
        console.error('error', 'An unknown error has occurred <code>'+ err.message +'</code>');
      });

      primus.on('data', function incoming(data) {
        switch (data.action) {
          case 'message':
            var existing = false;
            // check if message exists as pending
            self.unverifiedMessageIndexes.forEach(function (index, unverifiedIndex) {
              if (data.clientDate == self.messages[index].clientDate) {
                // found it! lets merge
                self.messages[index] = $.extend({}, self.messages[index], data);
                // remove unverified index
                self.unverifiedMessageIndexes.splice(unverifiedIndex, 1);

                existing = true;
                UI.refresh(); // force refresh
                return false;
              }
            });

            // Push onto list if doesn't already exist
            if (existing === false)
              self.messages.push(data);
            break;

          default:
          case 'raw':
            self.messages.push({
              date: performance.now(),
              source: 'system',
              message: data
            });
        }
      });

      primus.on('end', function end() {
        console.log('end', 'The connection has ended.');
        this.updateStatus('finished');
      });

      primus.on('close', function end() {
        console.log('close', 'We\'ve lost the connection to the server.');
      });
    }
  };

})();
