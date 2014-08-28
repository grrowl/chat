// MessageActions


var AppDispatcher = require('../dispatcher/AppDispatcher');
var TodoConstants = require('../constants/TodoConstants');

var MessageActions = {
  create: function(message, room) {
    AppDispatcher.handleViewAction(
        {
        actionType: 'MESSAGE_CREATE',
        data: {
          clientDate: performance.now(),
          room: room,
          messsage: message,
          name: 'a butt'
        }
      }
    );
  }
}

module.exports = MessageActions;

