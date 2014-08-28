/**
 * @jsx React.DOM
 */

var React = require('react');
var addons = require('react/addons').addons;

var AppDispatcher = require('../dispatcher/AppDispatcher');
var MessageStore = require('../stores/MessageStore');
var MessageActions = require('../actions/MessageActions');

// Message Views

var MessageList = React.createClass({
  propTypes: {
    room: React.PropTypes.string.isRequired,
  },

  _roomFilter: function (message) {
    return !!(message.room === this.props.room);
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
    var messages = [],
        filterRooms = ['system', this.props.room ];

    this.state.messages.forEach(function (message) {
      if (filterRooms.indexOf(message.room) == -1) {
        return;
      }
      messages.push(MessageItem( message ));
    });

    return (
      <div>
        <ul id="log">
          {messages}
        </ul>
        <MessageInput
          placeholder={"Say something to room "+ this.props.room}
          onSave={this._createMessage} />
      </div>
    );
  },

  _createMessage: function(text) {
    MessageActions.create(text, this.props.room);
  }
});

var MessageItem = React.createClass({
  toggleLike: function() {
    console.log('toggleLike', arguments);
    alert('great work!');
  },

  getName: function() {
    if (!this.props.source)
      return 'unknown';
    else if (this.props.source.length == 20)
      return random_name(this.props.source);
    else
      return this.props.source;
  },

  render: function () {
    console.log('messageitem', this.props);

    // once we implement formatting:
    // <span dangerouslySetInnerHTML={{__html: rawMarkup}} />
    var name = 'unknown';
    if (this.props && this.props.name)
      name = this.props.name;

    return (
      <li className={React.addons.classSet({
        // completed: 'type-'+ this.props.action,
        verified: ~~this.props.date
      })}>
        <h4>
          { this.getName(name) }
        </h4>
        <div className="message" onDoubleClick={ this.toggleLike }>
          { this.props.text }<br />
          { this.props.clientDate } / { this.props.serverDate }
        </div>
      </li>
    );
  }
});


var MessageInput = React.createClass({

  propTypes: {
    onSave: React.PropTypes.func.isRequired,
    placeholder: React.PropTypes.string,
    value: React.PropTypes.string
  },

  getInitialState: function () {
    return {
      value: this.props.value || ''
    }
  },

  _save: function () {
    this.props.onSave(this.state.value);

    // Reset state
    this.setState({
      value: this.props.value || ''
    });
  },

  _onClick: function () {
    this._save();
  },

  _onChange: function(event) {
    this.setState({
      value: event.target.value
    });
  },

  _onKeyDown: function (event) {
    // KEY_ENTER == 13
    if (event.keyCode == 13)
      this._save();
  },

  render: function () {
    return (
      <div className="input-group input-group-lg">
        <input
          type="text" className="form-control"
          placeholder={this.props.placeholder}
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

module.exports = {
  MessageList: MessageList,
  MessageItem: MessageItem
};
