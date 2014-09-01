/**
 * @jsx React.DOM
 */

var React = require('react');
var addons = require('react/addons').addons;

var AppDispatcher = require('../dispatcher/AppDispatcher');
var MessageStore = require('../stores/MessageStore');

var MessageImage = React.createClass({

  propTypes: {},

  getInitialState: function () {
    return {}
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

  render: function () {
    return (
      <div className="webcam-image">
        image
      </div>
    );
  }
});


module.exports = MessageImage;
