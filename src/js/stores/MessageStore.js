// MessageStore

var AppDispatcher = require('../dispatcher/AppDispatcher');
var EventEmitter = require('events').EventEmitter;
var merge = require('react/lib/merge');

var CHANGE_EVENT = 'change';

// Messages storage
var _messages = {};

// TODO: implement _unvalidatedMessageIndexes, for messages saved as
// .clientDate awaiting a valid .serverDate

/**
 * Update a Message
 * @param {string} id The message's serverDate
 * @param {object} updates An object literal containing only the data to be
 *     updated.
 */
function update(updates) {
  var id = updates.serverDate,
      localId = updates.clientDate;

  // Check if the update is an acknowledgement of a previously sent message.
  // This will false positive if the server sends a clientDate incorrectly,
  // and that exact timestamp exists on our side. The chances of an *exact*
  // microsecond id collision is very low. I hope.
  if (localId && id && _messages[localId]) {
    // Migrate message

    _messages[id] = merge(_messages[localId], updates);
    delete _messages[localId];

    console.log('moving ', localId, 'to', id);

  } else if (localId && id === undefined) {
    // New message, before server ack
    _messages[localId] = updates;

  } else if (_messages[id] === undefined) {
    // Server sent message unknown to us
    _messages[id] = updates;

  } else {
    // Server sent message known to us -- merge
    _messages[id] = merge(_messages[id], updates);
  }

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
        messages.push(_messages[i]);
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
      message = payload.data;

  switch(action) {
    case 'MESSAGE_CREATE':
      update(message);
      break;

    case 'MESSAGE_UPDATE':
      update(message);
      break;

    default:
      return true; // resolve promise
  }

  MessageStore.emitChange(); // also, something changed
  return true; // resolve promise

});


module.exports = MessageStore;
