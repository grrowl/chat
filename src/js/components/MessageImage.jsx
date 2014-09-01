/**
 * @jsx React.DOM
 */

var React = require('react');
var addons = require('react/addons').addons;
var Whammy = require('whammy');

var AppDispatcher = require('../dispatcher/AppDispatcher');
var MessageStore = require('../stores/MessageStore');

var getUserMedia = (
  navigator.getUserMedia ||
  navigator.mozGetUserMedia ||
  navigator.webkitGetUserMedia ||
  function () {
    console.error('getUserMedia not supported');
  }
);

var MessageImage = React.createClass({
  _fps: 15, // frames per second
  _duration: 1000, // total duration

  _canvas: undefined,
  _whammy: undefined,

  propTypes: {
    onSave: React.PropTypes.func,
    width: React.PropTypes.number,
    height: React.PropTypes.number
  },

  getDefaultProps: function () {
    return {
      width: 200,
      height: 100
    }
  },

  getInitialState: function () {
    return {
      camming: false,   // access to webcam?
      recording: false, // recording current stream?
      saving: false     // saving recorded asset to server?
    }
  },

  // componentWillMount: function () {
  componentDidMount: function () {
    var webcam = this.refs.webcam,
        webcamElem = webcam.getDOMNode();

    // Set up our off-DOM canvas renderer
    this._canvas = document.createElement('canvas');
    this._canvas.width = this.props.width;
    this._canvas.height = this.props.height;
    this._canvasContext = this._canvas.getContext('2d');

    getUserMedia.call(navigator, { video: true },
      function success(stream) {
        console.log('success!', webcam, webcamElem);

        webcamElem.src = window.URL.createObjectURL(stream);
        webcamElem.play(); // apparently important
        self.stream = stream;

        _whammy = new Whammy.Video();
      },
      function fail() {
        console.warn('webcam fail');
      });
  },

  // Notification from "upstairs" about a message being saved
  onCreateMessage: function () {
    if (this.state.recording) {
      // todo: pause current webcam save, fork upload process, restart recording
      console.warn('MessageImage record-during-record.');
      throw new Error("MessageImage called to record during record");
    }

    this.setState({
      recording: true
    });

    var videoElem = this.refs.webcam.getDOMNode();

    var maxFrames = this._fps * (this._duration / 1000),
        numFrames = 0,
        frameDuration = 1000 / this._fps,
        recordInterval;

    recordInterval = setInterval(function () {
      numFrames++;

      if (numFrames < maxFrames) {
        this._canvasContext.drawImage(videoElem, 0, 0, this.props.width, this.props.height);
        _whammy.add(this._canvasContext, frameDuration);

      } else {
        clearInterval(recordInterval);
        console.log('recording done');
        var output = _whammy.compile();

        console.log((window.webkitURL || window.URL).createObjectURL(output));

        videoElem.src = (window.webkitURL || window.URL).createObjectURL(output);
      }
    }.bind(this), frameDuration);
  },

  // upload image to the server
  _upload: function (dataURI) {

  },

  // if video.paused or video.ended -> handle error

  render: function () {
    return (
      <div className="webcam-image">
        <video
          ref="webcam"
          width={this.props.width}
          height={this.props.height} />
      </div>
    );
  }
});


module.exports = MessageImage;
