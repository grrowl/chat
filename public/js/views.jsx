/**
 * @jsx React.DOM
 */

// Message Views

var MessageList = React.createClass({
  render: function() {
    var messages = [],
        filterRooms = ['global', Chat.currentRoom];

    this.props.messages.forEach(function (message) {
      if (filterRooms.indexOf(message.room) == -1) {
        return;
      }
      messages.push(
        <MessageItem message={message} />
      );
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
  },

  render: function () {
    // once we implement formatting:
    // <span dangerouslySetInnerHTML={{__html: rawMarkup}} />
    return (
      <li className={React.addons.classSet({
        // completed: 'type-'+ this.props.message.action,
        verified: ~~this.props.message.date
      })}>
        <h4>{this.props.message.source}</h4>
        <div className="message" onDoubleClick={this.toggleLike}>
          {this.props.message.text}
        </div>
      </li>
    );
  }
});
