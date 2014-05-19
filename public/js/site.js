var Chat = {
  primus: undefined,
  joinedRooms: ['global'],
  history: [],

  init: function () {
    Log.init();

    this.primus = new Primus();
    this.primus = Primus.connect(window.location.href);
    Chat.bindEvents();
  },
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
      clientDate: performance.now,
      message: message
    }

    Chat.history.push($.extend({}, sendObject, { received: false }));
    this.primus.write(sendObject);

    console.log('message', sendObject);
  },

  // Join a room/channel
  join: function (room) {
    this.primus.write({ action: 'join', room: room });
  },

  // Leave a room/channel
  leave: function (room) {
    this.primus.write({ action: 'leave', room: room });
  },

  // setup
  bindEvents: function () {
    var primus = this.primus,
        log = Log.append;

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
      console.error('error', 'An unknown error has occured <code>'+ err.message +'</code>');
    });

    primus.on('data', function incoming(data) {
      console.log('data', 'string' === typeof data ? data : '<pre><code>'+ JSON.stringify(data, null, 2) +'</code></pre>');

      switch (data.action) {
        case 'message':
          Log.append(data.message, data.source, 'message');
          break;

        default:
        case 'raw':
          Log.append(data, 'system', 'system');
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

var Log = {
  $list: undefined,
  init: function () {
    Log.$list = $('#log');
  },
  append: function(message, title, type) {
    var $li = $('<li>');
    $li.addClass('status-'+ type);
    $li.append($('<h4>').text(title));
    $li.append($('<p>').html(message));

    Log.$list.append($li);

    $('body').scrollTop($('body').height());
  }
}

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
