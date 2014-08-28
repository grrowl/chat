// pockychat
(function () {

  // MessageStore : Store <- emits events (onChange callbacks)
  // AppDispatcher : Dispatcher <- main dispatcher, accepts

  var React = require('react');

  var AppDispatcher = require('./dispatcher/AppDispatcher');

  var ChatClient = require('./ChatClient');

  var MessageList = require('./components/views.jsx').MessageList;

  React.renderComponent(
    MessageList({ room: 'pockychat' }),
    document.querySelector('#messageContainer')
  );

  /*
  var $ = require('jquery'),
      Whammy = require('whammy');

  var Chat = require('./chat'),
      UI = require('./ui'),
      Webcam = require('./webcam'),
      Views = require('./views.jsx');

  $(Chat.init.bind(Chat));
  $(UI.init.bind(UI));
  $(Webcam.init.bind(Webcam, '#webcamPreview'));

  */

})();
