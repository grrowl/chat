/*
 * faceToGif, based on works by <>
 * MIT Licence
 */
/*

faceToGif(videoContainer):
  videoContainer will have a <video> appended

*/

function faceToGif(videoContainer) {
  // statics
  this.settings = {
    // TODO: cut out vestigal code
    captureSize: { w: 320, h: 240 }, // TODO: what is captureSize and this.size?
    ms: 100,
    preset: 'normal'
  }
  this.size = { w: 648, h: 480 };

  // Event tracking
  this.events = {}

  // state enum: IDLE, STREAMING, RECORDING, PAUSED, SAVING, COMPRESSING
  this.state = 'IDLE';

  // recording variables
  this.videoContainer = videoContainer;
  this.canvas = undefined; // created internally
  this.video = undefined; // created element in page

  this.blobs = [];
  this.frames = [];

  this.init();
}

faceToGif.prototype = {
  init: function () {
    var self = this;

    // this.video = document.querySelector('video');
    this.video = document.createElement('video');

    this.videoContainer.appendChild(this.video);

    this.canvas = document.createElement('canvas');

    // TODO: review if this still applies
    self.onResize();
    var on_resize_throttle;
    window.addEventListener('resize', function () {
      clearTimeout(on_resize_throttle);
      on_resize_throttle = setTimeout(self.onResize, 400);
    }, false);
  },

  getStream: function (successCallback, failCallback) {
    (navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia || thisBrowserIsBad).call(navigator, {video: true}, successCallback, failCallback);
  },

  onResize: function () {
    // var preset = gifSizes.full, presetstring;
    // if (document.documentElement.clientWidth < 640) {
    //   preset = gifSizes.normal;
    // }
    // presetstring = preset.join('');
    // if (currentVideoPreset != presetstring) {
    //   currentVideoPreset = presetstring;
    //   facetogif.video.width = preset[0];
    //   facetogif.video.height = preset[1];
    // }

  },

  // TODO: call changeSize at start? or on resize?
  // facetogif.changeSize(ev.target.value);
  changeSize: function (width, height) {
    this.size = [ width, height ];
    track('recording', 'changed-size', presetName);
    return this.size;
  },

  // Fill recorder frame to fit capture size
  recorderFrame: function () {
    var frame = {
      x: 0, y: 0,
      w: null, h: null
    };
    frame.w = this.size[0];
    frame.h = this.size[1];
    // TODO: offset frame x,y to fit-without-borders
    return frame;
  },

  /*
  /// Event methods

  // Bind a callback to an event
  on: function (eventName, callback) {
    if (typeof this.events[eventName] != "undefined") {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
  },

  // Trigger an event
  trigger: function (eventName, args) {
    if (this.events[eventName])
      this.events[eventName].forEach(function (callback, index) {
        callback.call(this, args);
      }, this);
  },
  */

  // Recording methods

  // TODO: this is named badly
  initCanvas: function () {
    var c = facetogif.canvas;
    c.width = this.settings.captureSize.w;
    c.height = this.settings.captureSize.h;
    return c;
  },

  // appends the img[src="data:"] element to the page
  displayGIF: function (img) {
    var article = document.createElement('article');
    // article.appendChild(facetogif.controls.cloneNode(true));
    article.appendChild(img);
    article.className = "generated-gif separate " + facetogif.gifSettings.preset;
    img.className = "generated-img";
    facetogif.gifContainer.appendChild(article);
  },

  // argument opts
  // - blob: File Blob (required if img not present)
  // - img: HTMLElement (required if blog not present)
  // - onuploaded: function (json)
  // - oncanupload: function ()
  // - oncannotupload: function ()
  // - onoptimize: function ()
  //
  upload: function (opts) {
    var blob = opts.blob || facetogif.blobs[opts.img.dataset.blobindex];
    if (facetogif.is_blob_too_big(blob)) {
      if (!opts.is_second_pass) {
        opts.onoptimize && opts.onoptimize();
        opts.is_second_pass = true;
        facetogif.optimise(facetogif.frames[opts.img.dataset.framesindex], function (blob) {
          opts.blob = blob;
          facetogif.upload(opts);
        });
      } else {
        opts.oncannotupload && opts.oncannotupload();
      }
    } else {
      opts.oncanupload && opts.oncanupload();
      facetogif.do_up(blob, opts.onuploaded);
    }
  },

  // optimise GIF
  // called by upload() when needed
  optimise: function (frames, callback) {
    //start with the second writer!
    var w = facetogif.secondWorker || (facetogif.secondWorker = new Worker('js/vendor/gifwriter.worker.js'));
    w.onmessage = function (e) {
      var blob = new Blob([e.data.bytes], {type: 'image/gif'});
      callback(blob);
    }
    w.postMessage({
      imageDataList: frames.filter(function (e, i) { return !!i%3 }),
      width: facetogif.gifSettings.width,
      height: facetogif.gifSettings.height,
      paletteSize: 95,
      delayTimeInMS: facetogif.gifSettings.ms
    });
  },

  is_blob_too_big: function (blob, max) {
    return blob.size > (max || (2048 * 1024));
  },

  // STATE METHODS

  // Display webcam stream, calls statusCallback with success boolean
  startStreaming: function(statusCallback) {
    var self = this;
    track('streaming', 'request');

    this.getStream(function (stream) {
      track('streaming', 'start');
      self.video.src = window.URL.createObjectURL(stream);
      self.stream = stream;
      statusCallback(true);
    },
    function (fail) {
      track('streaming', 'failed');
      console.log(fail);
      statusCallback(false);
    });
  },

  // Stop streaming the webcam image
  stopStreaming: function() {
    if (this.stream) {
      track('streaming', 'stop');
      this.stream.stop();
      this.stream = null;
      this.video.removeAttribute('src');
      // TODO: ASK_FOR_PERMISSION message/callback
      // button.innerHTML = facetogif.str.ASK_FOR_PERMISSION;
    } else {
      console.error('Not currently streaming');
    }
  },

  // start recording stream
  startRecording: function() {
    var recorder = this.recorder;
    if (recorder.state === recorder.states.RECORDING || recorder.state === recorder.states.PAUSED) {
      // mainbutton.classList.remove('recording');
      // mainbutton.innerHTML = facetogif.str.COMPILING;
      // pause.innerHTML = facetogif.str.PAUSE;
      recorder.pause();
      // facetogif.recIndicator.classList.remove('on');
      this.state = 'RECORDING';
      // mainbutton.disabled = true;
      // mainbutton.classList.add('processing');
      // mainbutton.parentNode.classList.add('busy');
      recorder.state = recorder.states.COMPILING;
      recorder.compile(function (blob) {
        var img = document.createElement('img');
        img.src = URL.createObjectURL(blob);
        img.dataset.blobindex = facetogif.blobs.push(blob) -1;
        img.dataset.framesindex = facetogif.frames.push(recorder.frames) -1;
        console.log(img);
        // facetogif.displayGIF(img);
        // mainbutton.removeAttribute('disabled');
        // mainbutton.classList.remove('processing');
        // mainbutton.parentNode.classList.remove('busy');
        // mainbutton.innerHTML = facetogif.str.START_RECORDING;
        track('generated-gif', 'created');
      });
      track('recording', 'finished');
    } else if (recorder.state === recorder.states.IDLE || recorder.state === recorder.states.FINISHED) {
      track('recording', 'start');
      recorder.gif = new GIF({
        workers: 2,
        width: this.size.w,
        height: this.size.h,
        quality: 20,
        workerScript: 'js/facetogif/gif.worker.js'
      });
      recorder.setBusy();
      recorder.frames = [];
      recorder.ctx = this.initCanvas().getContext('2d');
      recorder.start();
    }
  },

  // pause recording of stream
  pauseRecording: function() {
    var recorder = this;
    if (recorder.state === recorder.states.RECORDING) {
      track('recording', 'pause');
      recorder.pause();
      console.log('paused');
      // pause.innerHTML = facetogif.str.RESUME;
      // facetogif.recIndicator.classList.remove('on');
      this.state = 'PAUSED';
    } else if (recorder.state === recorder.states.PAUSED) {
      recorder.setBusy();
      track('recording', 'resume');
      recorder.start();
    }
  },

  //
  finishRecording: function() {

  },

  asGif: function() {
    // TODO
    // container.querySelector('.generated-img').src;
  // ...
  // facetogif.upload({
  //   img: container.querySelector('.generated-img'),
  //   onuploaded: function (json) {
  //     e.target.innerHTML = facetogif.str.UPLOADED;
  //     e.target.href = 'http://imgur.com/' + json.data.id;
  //     e.target.classList.remove('processing');
  //     e.target.classList.add('uploaded');
  //     track('generated-gif', 'is on imgur.com');
  //   },
  //   oncanupload: function () {
  //     e.target.classList.remove('upload');
  //     e.target.classList.add('processing');
  //     e.target.innerHTML = facetogif.str.UPLOADING;
  //   },
  //   oncannotupload: function () {
  //     e.target.parentNode.removeChild(e.target);
  //     alert('The gif is still too big for imgur. :-(');
  //     track('generated-gif', 'toobig');
  //   },
  //   onoptimize: function () {
  //     track('generated-gif', 'optimising');
  //     e.target.classList.add('processing');
  //     e.target.innerHTML = facetogif.str.OPTIMISING;
  //   }
  // });
  },
}

faceToGif.prototype.recorder = {
  state: 0,
  gif: null,
  interval: null,
  frames: [],
  ctx: null,
  states: {
    IDLE: 0,
    RECORDING: 1,
    PAUSED: 2,
    COMPILING: 3,
    FINISHED: 4,
    BUSY: 5
  },
  setBusy: function () {
    facetogif.video.dataset.state = recorder.state = recorder.states.BUSY;
  },
  setFinished: function () {
    recorder.state = recorder.states.FINISHED;
  },
  start: function () {
    facetogif.video.dataset.state = recorder.state = recorder.states.RECORDING;
    recorder.interval = setInterval(this.recorder_fn(recorder.ctx, recorder.gif, recorder.frames), facetogif.gifSettings.ms);
  },
  pause: function () {
    facetogif.video.dataset.state = recorder.state = recorder.states.PAUSED;
    clearInterval(recorder.interval);
  },
  compile: function (callback) {
    facetogif.video.dataset.state = recorder.state = recorder.states.COMPILING;
    recorder.gif.on('finished', function (blob) {
      recorder.setFinished();
      callback(blob);
      delete facetogif.video.dataset.state;
    });
    recorder.gif.render();
  },

  // todo requires attention
  recorder_fn: function (ctx, gif, frames) {
    var coords = this.recorderFrame(),
      drawW = this.gifSettings.w,
      drawH = this.gifSettings.h;
      ctx.translate(coords.w, 0);
      ctx.scale(-1, 1);
    return function () {
      if (this.video.src) {
        ctx.drawImage(this.video, coords.x,coords.y, coords.w,coords.h);
        var frame = ctx.getImageData(0,0, drawW,drawH);
        frames.push(frame);
        gif.addFrame(frame, {delay: this.gifSettings.ms});
      } else {
        clearInterval(recorder.interval);
        this.recIndicator.classList.remove('on');
        recorder.state = recorder.states.IDLE;
      }
    }
  }

};


// TODO: for now
function track() {
  if (typeof ga !== "undefined") {
    ga.apply(ga, ['send', 'event'].concat([].slice.call(arguments)));
  }
}
