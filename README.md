 # pockychat

Based on works:
* https://github.com/primus/primus#connecting-from-the-browser
* https://github.com/cayasso/primus-rooms
* ~https://github.com/zeMirco/primus-express-session~
* ~https://github.com/hdragomir/facetogif~ (MIT Licence)

## Server Side
All the server has to do is serve static files, and allow users to: a) subscribe to one or more channels (lobby, someroom, user-to-user), and b) accept messages to rebroadcast to everyone on those channels.

Actually:

node.js runs on port :3000, apache proxies connections through it. We should always connect directly to :3000 for websockets though to avoid apache's overhead.

node.js can simply run on another port and serve primus.js. Static files can be built seperately and hosted on apache. All we need is a self-contained API/app (on the node.js side)

#### Requisites outside npm
* compass (and sass)
* ~mongo~

## Client side
All messages are in the `Chat.history`. Updates from the server can be checked against `Message.clientDate`

````
             +-------------+                                  
         +---+   Client    +---+                              
         |   +-------------+   |                              
         |                     |                              
         v                     v                              
        File                Primus                            
       upload               message                           
         +                   quueue                           
         |                     +                              
         |                     |                              
       +-+---------------------+--+                           
          PK: Message.clientTime                              
       +-+---------------------+--+                           
         |                     |                              
+-----+--+--------+      +-----+------+          _            
|   Save file &   |      |            |         (  )          
| Dispatch 'file' +----> |   Primus   +----> ( `  ) . )       
| Message update  |      |            |     (_, _(  ,_)_)     
+-----------------+      +------+-----+                       
                                |                             
                          ______v_____                        
                         (____________)                       
                         |            |                       
                         |  Mongo DB  |                       
                         |            |                       
                         +------+-----+                       
                                |                             
                                |                             
                                v                             
                                                              
                   ( endpoint: /history?since=x )
````

### Action types:
and payload keys

Messages:
  MESSAGE_CREATE: id, message
  MESSAGE_UPDATE: id, message

Connection: (primus)
  CONN_RECONNECTING "in a reconnecting state": attempt, timeout
  CONN_RECONNECT "attempting reconnect"
  CONN_ONLINE
  CONN_OFFLINE
  CONN_OPEN "CONN established"
  CONN_ERROR message
  CONN_DATA "ondata"
  CONN_END "graceful"
  CONN_CLOSE "lost"

Webcam:
  MESSAGE_IMAGE: id, imagepath



### Action struct
Passed around internally or cross-channel

{
  source: (optional) `SERVER_ACTION`, `VIEW_ACTION`
  action: message, join, leave, ...
  data: { data }
}

### Message struct:

{
  source: spark id

  ~room    : optional?, room to broadcast to
  action  one of [ message*, join, leave, message, system ]
  text : required, text to display

  clientDate : sent by client, only sent back to original client as acknowledgement
  serverDate : global id, set by server ONLY.
}

Messages are sent to the server with a .clientDate. The server will always
reply with a .serverDate parameter

### TODO Webcam struct

{
  clientDate: reflects Message
  imageData: our .webm Blob
}

### TODO user struct

{
  source: spark id
  name: display name
}

## TODOs

* [ ] Massage ChatServer to rely on ecstatic's default functionality, clean up all that fuckin else/if nonsense
* [ ] Webcam file uploading
  [ ] [Lazy gzipping?](https://github.com/jesusabdullah/node-ecstatic#optsgzip) - since there will be *n* requests within 5 seconds, maybe we only run a gzip step when a certain threshold of users will probably load it (still slow for client)
  [ ] [ecstatic, offer to code different cache times for different urls](https://github.com/jesusabdullah/node-ecstatic/issues/94)
* [ ] rename/refactor MESSAGE_UPDATE to `MESSAGE_RECEIVED`

### Static server options

* [ecstatic](https://github.com/jesusabdullah/node-ecstatic) - good! only con: can't set caching headers per-file. maybe do a PR
* [st](https://github.com/isaacs/st) - more config but mostly in the wrong ways
*

### Webcam capture

MessageImage will listen for MESSAGE_CREATE actions generated by the view and attach the last best image to them. If we've had a file dropped on the MessageImage, use that (as Blob, same deal), if not activate Whammy and generate a webm (either way, something will fire a _complete callback with a Blob)
We fire a MESSAGE_IMAGE_CREATE with corresponding

1. keep it simple and unified -- it's okay to upload the image and not display it until the server replies with an authoritive url
2. is listening for any event being created okay? we should rename MESSAGE_UPDATE to `MESSAGE_RECEIVED`
3. This is a test to see how resilliant uploading 1MB webm's are -- we can investigate chunked uploads if not

4. server tasks
  1. upload and dump into dumb /assets/serverDate.webm folder on server -- SERVE AS EVER-CACHED for cloudfront and everyone
  2. detect webm, pipe through ffmpeg if available (below)


### Chat features

* [x] Tighening of message passing. Both server (db) and client (`Chat.messages`) simply extend Messages on update based on Message.clientDate (unverified messages) or Message.serverDate (known messages)
* [/] Webcam capture and encoding
  [ ] needs adaptivve sizing (http://stackoverflow.com/a/14352274/894361)
* [ ] Store messages and room lists in-memory (history)
* [ ] History

* [ ] Authentication/Authorisation (Passport)
  * Guest + Email + Facebook
  * https://github.com/jaredhanson/passport-anonymous
  * Anyone can join a room that does not exist
  * You must be invited to existing rooms, except for "public" rooms. You can invite by facebook id
  * We will have to track ID histories to persist permission through reconnects.
  * And a clientid-only solution is very insecure (ids are public)
  * http://www.sitepoint.com/passport-authentication-for-nodejs-applications/
* [ ] SSL-TLS (use `wss://`, not `ws://`. We need a `*.chillidonut.com` cert. when Chat ships, that's my treat ha!)

### Known issues

* serverDate may be at risk of collision/overflows, but prelim testing using `(new Date()).getTime() * 1000 + performance.now()` have shown it should support a very long server-uptime.
  * 15 significant figures in our serverDate floating-point number
  * until we implement proper timestamping, which we'll also migrate `serverDate` to a proper, global integer id.

### webm

* WebM encoding on the client side with [whammy](https://github.com/antimatter15/whammy)
* Re-encoding that file upon upload using ffmpeg
  * I had to install with `--enable-libvpx --enable-libvorbis`
  * on OSX: `brew install ffmpeg --with-libvpx --with-libvorbis`
  * Look up options at https://trac.ffmpeg.org/wiki/Encode/VP8
  * No audio `-an`
  * Re-encode test results:
    1. `ffmpeg -i input.mp4 -c:v libvpx -crf 10 -b:v 1M -an output.webm`: 1.1MB -> 298KB
    2. `ffmpeg -i input.mp4 -c:v libvpx -crf 20 -b:v 512KB -an output.webm`: 1.1MB -> 197KB (mildly degraded quality?)
    3. `ffmpeg -i input.mp4 -c:v libvpx -crf 60 -b:v 128KB -an output.webm`: 1.1MB -> 125KB (as above)
  * When primus receives a "image" message, pipe it through a bash script to standardise the above commands ([see this](https://trac.ffmpeg.org/wiki/FilteringGuide#Scriptingyourcommandlineparameters))
  * we can pipe a stream directly into ffmpeg `cat webm-test-raw.webm | ffmpeg -i pipe:0 -c:v libvpx -crf 10 -b:v 1M -an webm-test-pipe1.webm`

### longer term considerations
* data[message].clientDate should NOT be sent to all clients (timing attack)
* base64 means the queue will fill (size-wise) and could back up/overflow

# LICENCE

This project is subject to the GPL for now, and incorporates some code distributed under the MIT Licence (such as the React-Seed boilerplate code, referenced below).

React and examples from [Flux](https://github.com/facebook/flux) are BSD licenced.

# Gulp information ([React-Seed](https://github.com/kriasoft/React-Seed))

#### Development Tools:

 * [Webpack](http://webpack.github.io/) - Compiles front-end source code into modules / bundles
 * [Gulp](http://gulpjs.com/) - JavaScript streaming build system and task automation
