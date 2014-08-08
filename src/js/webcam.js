// Webcam capture/recording/exporting

module.exports = {
  video: null,
  videoSize: { w: 640, h: 480 },

  canvas: null,
  canvasContext: null,
  captureSize: { w: 320, h: 240 },
  // captureInterval: 10,

  init: function (videoContainer) {
    this.video = document.createElement('video');
    $(videoContainer).append(this.video);

    this.canvas = document.createElement('canvas');
    $(this.canvas).attr({
      width: this.captureSize.w,
      height: this.captureSize.h
    });
    this.canvasContext = this.canvas.getContext('2d');

    // kick it off
    this.getStream(function (stream) {
      Webcam.video.src = window.URL.createObjectURL(stream);
      Webcam.video.play(); // apparently important
      Webcam.stream = stream;
    },
    function (fail) {
      console.error(fail);
    });
  },

  snapshot: function () {
    this.canvasContext.drawImage(this.video, 0, 0, this.captureSize.w, this.captureSize.h);

    return this.canvas;
  },

  getStream: function (successCallback, failCallback) {
    return (
      navigator.getUserMedia ||
      navigator.mozGetUserMedia ||
      navigator.webkitGetUserMedia ||
      function () {
        console.error('getUserMedia not supported');
      }
    ).call(navigator, { video: true }, successCallback, failCallback);
  },



  /*
  faceToGif: undefined,
  init: function () {
    this.faceToGif = new faceToGif(document.getElementById('webcamPreview'));
    this.faceToGif.play(function (status) {
      if (!status)
        return console.error('webcam failure');
    });
  }
  */
};
