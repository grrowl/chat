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
