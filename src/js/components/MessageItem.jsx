/**
 * @jsx React.DOM
 */

var React = require('react');
var addons = require('react/addons').addons;

var AppDispatcher = require('../dispatcher/AppDispatcher');
var MessageStore = require('../stores/MessageStore');

// Message Item

var MessageItem = React.createClass({
  toggleLike: function() {
    console.log('toggleLike', arguments);
    alert('great work!');
  },

  getName: function() {
    if (!this.props.source)
      return 'unknown';
    else if (this.props.source.length == 20)
      return this._randomName(this.props.source);
    else
      return this.props.source;
  },

  render: function () {
    // once we implement formatting:
    // <span dangerouslySetInnerHTML={{__html: rawMarkup}} />
    var name = 'unknown';
    if (this.props && this.props.name)
      name = this.props.name;

    return (
      <li className={React.addons.classSet({
        // completed: 'type-'+ this.props.action,
        verified: ~~this.props.date
      })} onDoubleClick={ this.toggleLike }>
        <h4>
          { this.getName(name) }
        </h4>
        <div className="message">
          { this.props.text }<br />
          { this.props.clientDate } / { this.props.serverDate }
        </div>
      </li>
    );
  }
});

module.exports = MessageItem;
