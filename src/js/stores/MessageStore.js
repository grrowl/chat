// MessageStore

var AppDispatcher = require('../dispatcher/AppDispatcher');
var EventEmitter = require('events').EventEmitter;
var merge = require('react/lib/merge');

var CHANGE_EVENT = 'change';

// Messages storage
var _messages = {};

/**
 * Create a Message
 * @param message The message object
 */
function create(message) {
  id = message.serverDate || message.clientDate;

  _messages[id] = message;
}

/**
 * Update a Message
 * @param {string} id The message's serverDate
 * @param {object} updates An object literal containing only the data to be
 *     updated.
 */
function update(id, updates) {
  var localId = updates.clientDate;

  // Check if the update is an acknowledgement of a previously sent message.
  // This will false positive if the server sends a clientDate incorrectly,
  // and that exact timestamp exists on our side. The chances of an *exact*
  // microsecond id collision is very low. I hope.
  if (localId && id && _messages[localId]) {
    _messages[id] = _messages[localId];
    delete _messages[localId];
  }

  _messages[id] = merge(_messages[id], updates);
}


var MessageStore = merge(EventEmitter.prototype, {
  /**
   * Get the entire collection of Messages.
   * @return {object}
   */
  getAll: function() {
    return _messages;
  },

  /**
   * Get a collection of Messages filtered by callback
   * @param {callback} Callback to filter by, if return true then keep message
   * @return {object}
   */
  getFiltered: function(callback) {
    var messages = [];

    for (var i in _messages) {
      if (callback(_messages[i]))
        messages[i] = _messages[i];
    }

    return messages;
  },

  emitChange: function() {
    this.emit(CHANGE_EVENT);
  },

  /**
   * @param {function} callback
   */
  addChangeListener: function(callback) {
    this.on(CHANGE_EVENT, callback);
  },

  /**
   * @param {function} callback
   */
  removeChangeListener: function(callback) {
    this.removeListener(CHANGE_EVENT, callback);
  }
});

// Register to handle all updates
AppDispatcher.register(function(payload) {
  var source = payload.source,
      action = payload.action,
      message = action.data;

  switch(action.actionType) {
    case 'MESSAGE_CREATE':
      create(message);
      console.log(_messages);
      break;

    case 'MESSAGE_UPDATE':
      update(message.serverDate, message);
      break;

    default:
      console.log('messagestore yeahhh', action.actionType, message);
      return true; // resolve promise
  }
      console.log('messagestore yeahhh', action.actionType, message);

  MessageStore.emitChange(); // also, something changed
  return true; // resolve promise

});

console.log('messagestore', _messages);


module.exports = MessageStore;
