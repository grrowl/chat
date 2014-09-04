/**
 * @jsx React.DOM
 */

var React = require('react');
var addons = require('react/addons').addons;

var AppDispatcher = require('../dispatcher/AppDispatcher');
var MessageStore = require('../stores/MessageStore');

var MessageImage = require('./MessageImage.jsx');

// Message Input

var MessageInput = React.createClass({

  propTypes: {
    room: React.PropTypes.string.isRequired,
    value: React.PropTypes.string
  },

  getInitialState: function () {
    return {
      value: this.props.value || ''
    }
  },

  _createMessage: function() {
    var message = {
      clientDate: performance.now(),
      room: this.props.room,
      text: this.state.value
    };

    // Notify MessageImage
    this.refs.image.onCreateMessage(message);

    AppDispatcher.dispatchViewAction(
      'MESSAGE_CREATE',
      message
    );

    // Reset state
    this.setState({
      value: this.props.value || ''
    });
  },

  _onClick: function () {
    this._createMessage();
  },

  _onChange: function(event) {
    this.setState({
      value: event.target.value
    });
  },

  _onKeyDown: function (event) {
    // KEY_ENTER == 13
    if (event.keyCode == 13)
      this._createMessage();
  },

  render: function () {
    return (
      <div className="input-group input-group-lg">
        <div className="input-group-addon">
          <MessageImage ref="image" />
        </div>
        <input
          type="text" className="form-control"
          placeholder={"Say something to room "+ this.props.room}
          onChange={this._onChange}
          onKeyDown={this._onKeyDown}
          value={this.state.value}
         />
        <span className="input-group-btn">
          <button id="btn-post" className="btn btn-primary"
          onClick={this._onClick}>Post</button>
        </span>
      </div>
    );
  }
});

module.exports = MessageInput;
