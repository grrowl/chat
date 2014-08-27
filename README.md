 # pockychat

Based on works:
* https://github.com/primus/primus#connecting-from-the-browser
* https://github.com/cayasso/primus-rooms
* ~https://github.com/zeMirco/primus-express-session~
* https://github.com/hdragomir/facetogif (MIT Licence)

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

## TODOs

### Gulp migration

* Webpack - restructure JS assets
  * CLEAN UP FEATURES just delete lines until we're functional again.
* Primus: serve primus.js library
* Primus: hook into server

### Chat features

[/] Tighening of message passing. Both server (db) and client (`Chat.messages`) simply extend Messages on update based on Message.clientDate (unverified messages) or Message.serverDate (known messages)
[/] Store messages and room lists in-memory, sync UI when needed (React.js?)
[ ] Webcam capture and encoding
[ ] History
[ ] new actions: 'like', 'unlike'; Message.likes

[ ] Authentication/Authorisation (Passport)
  * Guest + Email + Facebook
  * https://github.com/jaredhanson/passport-anonymous
  * Anyone can join a room that does not exist
  * You must be invited to existing rooms, except for "public" rooms. You can invite by facebook id
  * We will have to track ID histories to persist permission through reconnects.
  * And a clientid-only solution is very insecure (ids are public)
  * http://www.sitepoint.com/passport-authentication-for-nodejs-applications/
[ ] SSL-TLS


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

# Gulp information ([React-Seed](https://github.com/kriasoft/React-Seed))

#### Development Tools:

 * [Webpack](http://webpack.github.io/) - Compiles front-end source code into modules / bundles
 * [Gulp](http://gulpjs.com/) - JavaScript streaming build system and task automation
 * [Karma](http://karma-runner.github.io/) - JavaScript unit-test runner (coming)
 * [Protractor](https://github.com/angular/protractor) - End-to-end test framework (coming)

### Directory Layout

```
.
├── /bower_components/          # 3rd party client-side libraries
├── /build/                     # The folder for compiled output
├── /docs/                      # Documentation files
├── /node_modules/              # Node.js-based dev tools and utilities
├── /src/                       # The source code of the application
│   ├── /assets/
│   ├── /data/
│   ├── /common/
│   ├── /images/
│   ├── /styles/
│   ├── /services/
│   ├── /404.html
│   ├── /app.jsx
│   └── /index.html
├── /test/                      # Unit, integration and load tests
│   ├── /e2e/                   # End-to-end tests
│   └── /unit/                  # Unit tests
└── ...
```

### Getting Started

To get started you can simply clone the repo and install the dependencies:

```shell
> git clone https://github.com/kriasoft/React-Seed MyApp && cd MyApp
> npm install -g gulp           # Install Gulp task runner globally
> npm install                   # Install Node.js components listed in ./package.json
```

To compile the application and start a dev server just run:

```shell
> gulp --watch                  # or, `gulp --watch --release`
```

To build the project, without starting a web server run:

```shell
> gulp build                    # or, `gulp build --release`
```

Now browse to the app at [http://localhost:3000/](http://localhost:3000/)

* Gulp documentation to the project is licensed under the [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/) license.

### Some resources

* http://www.sitepoint.com/introduction-gulp-js/
