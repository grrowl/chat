// pockychat
(function () {

  // MessageStore : Store <- emits events (onChange callbacks)
  // AppDispatcher : Dispatcher <- main dispatcher, accepts

  var React = require('react');

  var AppDispatcher = require('./dispatcher/AppDispatcher');

  var ChatClient = require('./ChatClient');

  var MessageList = require('./components/MessageList.jsx');

  React.renderComponent(
    MessageList({ room: 'pockychat' }),
    document.querySelector('#messageContainer')
  );

})();
