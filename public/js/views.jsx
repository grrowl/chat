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

  componentWillReceiveProps: function (nextProps) {
    if (!nextProps.message.source)
      return;

    if (nextProps.message.source.length == 20) {
      this.setState({
        name: random_name(nextProps.message.source)
      });
    }
  },

  render: function () {
    // once we implement formatting:
    // <span dangerouslySetInnerHTML={{__html: rawMarkup}} />
    var name = 'unknown';
    if (this.state && this.state.name)
      name = this.state.name;

    return (
      <li className={React.addons.classSet({
        // completed: 'type-'+ this.props.message.action,
        verified: ~~this.props.message.date
      })}>
        <h4>{ name }</h4>
        <div className="message" onDoubleClick={this.toggleLike}>
          { this.props.message.text }
        </div>
      </li>
    );
  }
});
