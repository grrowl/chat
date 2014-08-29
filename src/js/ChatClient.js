// ChatClient

var AppDispatcher = require('./dispatcher/AppDispatcher');
var merge = require('react/lib/merge');

var _primus = null;
var _state = 'UNKNOWN';
var _connected = false;

// Register to handle all updates
AppDispatcher.register(function(payload) {
  var source = payload.source,
      action = payload.action,
      message = payload.data;

  switch (action) {
    case 'MESSAGE_CREATE':
      if (source === 'VIEW_ACTION')
        // TODO send message to server plz
      break;
  }

  // When the view creates a message, sync it to the server
  if (source === 'VIEW_ACTION' && action === 'MESSAGE_CREATE') {
    ChatClient.sendMessage(message);
  }

  return true; // resolve promise
});

var ChatClient = {
  initialise: function () {
    if (Primus === undefined)
      throw Error('Primus library missing');

    _primus = new Primus();
    _primus = Primus.connect(window.location.href);
    this.bindEvents();
  },

  getState: function () {
    return _state;
  },

  sendMessage: function (message) {
    var sendObject = {
      action: 'message',
      data: message
    };

    _primus.write(sendObject);
  },

  // Bind chat/protocol events
  bindEvents: function () {
    var self = this,
        primus = _primus;

    // We are scheduling a new reconnect attempt
    primus.on('reconnecting', function reconnecting(opts) {
      // console.warn('reconnecting', 'We are <strong>scheduling</strong> a new reconnect attempt. This is attempt <strong>'+ opts.attempt +'</strong> and will trigger a reconnect operation in <strong>'+ opts.timeout +'</strong> ms.');
      _state = 'reconnecting';
      _connected = false;

      AppDispatcher.dispatchServerAction('CONN_RECONNECTING', opts);
    });

    // Starting the reconnect attempt
    primus.on('reconnect', function reconnect() {
      // console.warn('reconnect', 'Starting the reconnect attempt, hopefully we get a connection!');

      _state = 'reconnecting';
      _connected = false;

      AppDispatcher.dispatchServerAction('CONN_RECONNECT');
    });

    // Connection status "online", does not mean websockets is up
    primus.on('online', function online() {
      // console.log('online', 'We have regained control over our internet connection.');
      AppDispatcher.dispatchServerAction('CONN_ONLINE');
    });

    // Connection status "offline"
    primus.on('offline', function offline() {
      // console.log('offline', 'We lost our internet connection.');

      AppDispatcher.dispatchServerAction('CONN_OFFLINE');
    });

    // Connection established
    primus.on('open', function open() {
      // console.log('open', 'The connection has been established.');

      _state = 'open';
      _connected = true;

      AppDispatcher.dispatchServerAction('CONN_OPEN');

      // (re-)join our rooms
      // self.join(self.rooms.join(' '), function () {
      //   console.log('init', 'joined rooms '+ self.rooms);
      // });
    });

    // Error handler
    primus.on('error', function error(err) {
      console.error('error', 'An unknown error has occurred <code>'+ err.message +'</code>');

      AppDispatcher.dispatchServerAction('CONN_ERROR', err);
    });

    // Data handler
    primus.on('data', function incoming(data) {
      switch (data.action) {
        case 'message':
          AppDispatcher.dispatchServerAction('MESSAGE_UPDATE', data.data);
          break;

        case 'join':
        case 'leave':
          console.warn('unkonwn server message recv', data);

      }
    });

    // Connection ended
    primus.on('end', function end() {
      console.log('end', 'The connection has ended.');

      _state = 'ended';
      _connected = false;
      AppDispatcher.dispatchServerAction('CONN_END', err);
    });

    // Connection closed
    primus.on('close', function end() {
      // console.log('close', 'We\'ve lost the connection to the server.');

      _state = 'closed';
      _connected = false;
      AppDispatcher.dispatchServerAction('CONN_CLOSE');
    });
  }
};

ChatClient.initialise();

module.exports = ChatClient;
