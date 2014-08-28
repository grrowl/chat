/**
 * @jsx React.DOM
 */

var React = require('react');
var addons = require('react/addons').addons;

var AppDispatcher = require('../dispatcher/AppDispatcher');
var MessageStore = require('../stores/MessageStore');

// Message Views

var MessageList = React.createClass({
  roomFilter: function (message) {
    return message.room === this.props.room;
  },

  getInitialState: function() {
    return {
      messages: MessageStore.getFiltered(this.roomFilter)
    };
  },

  // Set up
  comoponentDidMount: function () {
    MessageStore.addChangeListener(this._onChange);
  },

  // Tear down
  comoponentDidUnmount: function () {
    MessageStore.removeChangeListener(this._onChange);
  },

  // handler for when one of our stores changes
  _onChange: function () {
    this.setState({
      messages: MessageStore.getFiltered(this.roomFilter)
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
      <ul id="log">
        {messages}
      </ul>
    );
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
    // once we implement formatting:
    // <span dangerouslySetInnerHTML={{__html: rawMarkup}} />
    var name = 'unknown';
    if (this.state && this.state.name)
      name = this.state.name;

    var image = this.transferPropsTo(
      <MessageImage src={ this.props.imageData } />
    );

    console.log(React);
    return (
      <li className={React.addons.classSet({
        // completed: 'type-'+ this.props.action,
        verified: ~~this.props.date
      })}>
        <h4>
          { this.getName(name) }
        </h4>
        { image }
        <div className="message" onDoubleClick={ this.toggleLike }>
          { this.props.text }
        </div>
      </li>
    );
  }
});

var MessageImage = React.createClass({
  render: function () {
    console.log('messageimage', this.props);
    if (this.props.data) {
      return (
        <img src={ this.props.data } />
      );

    } else if (this.props.src) {
      return (
        <img src={ this.props.src } />
      );

    } else {
      return (
        <div>x</div>
      );
    }
  }
});


module.exports = {
  MessageList: MessageList,
  MessageItem: MessageItem,
  MessageImage: MessageImage
}
