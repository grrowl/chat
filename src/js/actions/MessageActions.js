// MessageActions


var AppDispatcher = require('../dispatcher/AppDispatcher');

var MessageActions = {
  create: function(text, room) {
    AppDispatcher.handleViewAction(
      {
        actionType: 'MESSAGE_CREATE',
        data: {
          clientDate: performance.now(),
          room: room,
          text: text,
          source: 'a butt'
        }
      }
    );
  }
}

module.exports = MessageActions;

