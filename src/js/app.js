// pockychat
(function () {

  var $ = require('jquery'),
      Chat = require('./chat'),
      UI = require('./ui'),
      Webcam = require('./webcam'),
      Views = require('./views.jsx');

  $(Chat.init.bind(Chat));
  $(UI.init.bind(UI));
  $(Webcam.init.bind(Webcam, '#webcamPreview'));

})();
