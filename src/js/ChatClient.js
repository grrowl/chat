// ChatClient

var AppDispatcher = require('./dispatcher/AppDispatcher');

var ChatClient = {
}

function send() {

}

// Register to handle all updates
AppDispatcher.register(function(payload) {
  var source = payload.source,
      action = payload.action,
      message = action.data;

  if (source !== 'VIEW_ACTION')
    return true; // resolve promise

  switch(action.actionType) {
    case 'MESSAGE_CREATE':
      send(message);
      break;

    default:
      return true; // resolve promise
  }

  return true; // resolve promise
});


module.exports = ChatClient;
