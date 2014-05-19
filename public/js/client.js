var Chat = {
  primus: undefined,

  // rooms we're in
  joinedRooms: ['global', 'pockyboard'],
  currentRoom: 'pockyboard',

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
      var newIndex = Array.prototype.push.call(Chat.messages, message);

      if (typeof message.date == 'undefined') {
        Chat.unverifiedMessageIndexes.push(newIndex - 1);
      }

      UI.refresh();
    }
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
      text: message
    }

    Chat.messages.push($.extend({}, sendObject, { received: false }));
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
    var primus = this.primus;

    primus.on('reconnecting', function reconnecting(opts) {
      console.warn('reconnecting', 'We are <strong>scheduling</strong> a new reconnect attempt. This is attempt <strong>'+ opts.attempt +'</strong> and will trigger a reconnect operation in <strong>'+ opts.timeout +'</strong> ms.')
      Chat.updateStatus('reconnecting')
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
      Chat.updateStatus('connected');

      // (re-)join our rooms
      Chat.join(Chat.joinedRooms.join(' '), function () {
        console.log('init', 'joined rooms '+ Chat.joinedRooms);
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
          Chat.unverifiedMessageIndexes.forEach(function (index, unverifiedIndex) {
            if (data.clientDate == Chat.messages[index].clientDate) {
              // found it! lets merge
              Chat.messages[index] = $.extend({}, Chat.messages[index], data);
              // remove unverified index
              Chat.unverifiedMessageIndexes.splice(unverifiedIndex, 1);

              existing = true;
              UI.refresh(); // force refresh
              return false;
            }
          });

          // Push onto list if doesn't already exist
          if (existing == false)
            Chat.messages.push(data);
          break;

        default:
        case 'raw':
          Chat.messages.push({
            date: performance.now(),
            source: 'system',
            message: data
          });
      }
    });

    primus.on('end', function end() {
      console.log('end', 'The connection has ended.');
      Chat.updateStatus('finished');
    });

    primus.on('close', function end() {
      console.log('close', 'We\'ve lost the connection to the server.');
    });
  }
}

// UI autonomy. Hopefully mostly abstracted framework
var UI = {
  init: function () {
    this.bindEvents();
  },
  bindEvents: function () {
    var $message = $('#message');

    var postMessage = function(ev) {
      if (ev.type != 'click') {
        if (ev.keyCode !== 13)
          return; // regular keypress
      }
      ev.preventDefault();
      Chat.message($message.val());
      $message.val('');
    }

    $('#message').on('keypress', postMessage);
    $('#btn-post').on('click', postMessage);
  },

  // render Room
  refresh: function() {
    React.renderComponent(
      // <MessageList />,
      MessageList({ messages: Chat.messages }),
      document.querySelector('#messageContainer')
    );
  }
}

$(Chat.init.bind(Chat));
$(UI.init.bind(UI));


// modified performance shim
// adds random fractional amount to encourage uniqueness
window.performance = window.performance || {};
performance.now = (function() {
  return performance.now       ||
         performance.mozNow    ||
         performance.msNow     ||
         performance.oNow      ||
         performance.webkitNow ||
         function() {
           return (new Date().getTime() + Math.random());
         };
})();
