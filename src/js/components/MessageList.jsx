/**
 * @jsx React.DOM
 */

var React = require('react');
var addons = require('react/addons').addons;

var AppDispatcher = require('../dispatcher/AppDispatcher');
var MessageStore = require('../stores/MessageStore');

var MessageItem = require('./MessageItem.jsx');
var MessageInput = require('./MessageInput.jsx');

// Message Views

var MessageList = React.createClass({
  propTypes: {
    room: React.PropTypes.string.isRequired,
  },

  _roomFilter: function (message) {
    return !!(['system', this.props.room ].indexOf(message.room) !== -1);
  },

  getInitialState: function() {
    return {
      messages: MessageStore.getFiltered(this._roomFilter)
    };
  },

  // Set up
  componentDidMount: function () {
    MessageStore.addChangeListener(this._onChange);
  },

  // Tear down
  componentDidUnmount: function () {
    MessageStore.removeChangeListener(this._onChange);
  },

  // handler for when one of our stores changes
  _onChange: function () {
    this.setState({
      messages: MessageStore.getFiltered(this._roomFilter)
    });
  },

  render: function() {
    var messages = [];

    this.state.messages.forEach(function (message) {
      messages.push(MessageItem( message ));
    });

    return (
      <div>
        <ul id="log">
          {messages}
        </ul>
        <MessageInput
          room={this.props.room}
          onSave={this._createMessage} />
      </div>
    );
  }
});

module.exports = MessageList;
