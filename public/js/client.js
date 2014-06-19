var Chat = {
  primus: undefined,

  // rooms we're in
  joinedRooms: ['global', 'pockyboard'],
  currentRoom: 'pockyboard',

  // total message history in memory
  messages: [],

  // indexes of messages sent to the server and not received back yet
  unverifiedMessageIndexes: [],

  // Initialise the chat channel system
  init: function () {
    this.primus = new Primus();
    this.primus = Primus.connect(window.location.href);
    this.bindEvents();

    this.messages.push = function (message) {
      var newIndex = Array.prototype.push.call(Chat.messages, message);

      if (typeof message.date == 'undefined') {
        Chat.unverifiedMessageIndexes.push(newIndex - 1);
      }

      UI.refresh();
    }
  },

  // update connection status (connecting)
  updateStatus: function (status) {
    $('#status').text(status);
  },

  // Send message to room
  message: function (message, room) {
    var sendObject;
    if (!this.primus)
      return console.error('message', 'Not connected');

    sendObject = {
      action: 'message',
      room: room || 'global',
      clientDate: performance.now(),
      text: message,
      imageData: Webcam.snapshot().toDataURL('image/png') || ''
    }

    Chat.messages.push($.extend({}, sendObject, { received: false }));
    this.primus.write(sendObject);
  },

  // Join a room/channel
  join: function (room) {
    this.primus.write({ action: 'join', room: room });
  },

  // Leave a room/channel
  leave: function (room) {
    this.primus.write({ action: 'leave', room: room });
  },

  // Bind chat/protocol events
  bindEvents: function () {
    var primus = this.primus;

    primus.on('reconnecting', function reconnecting(opts) {
      console.warn('reconnecting', 'We are <strong>scheduling</strong> a new reconnect attempt. This is attempt <strong>'+ opts.attempt +'</strong> and will trigger a reconnect operation in <strong>'+ opts.timeout +'</strong> ms.')
      Chat.updateStatus('reconnecting')
    });

    primus.on('reconnect', function reconnect() {
      console.warn('reconnect', 'Starting the reconnect attempt, hopefully we get a connection!');
    });

    primus.on('online', function online() {
      console.log('online', 'We have regained control over our internet connection.');
    });

    primus.on('offline', function offline() {
      console.log('offline', 'We lost our internet connection.');
    });

    primus.on('open', function open() {
      console.log('open', 'The connection has been established.');
      Chat.updateStatus('connected');

      // (re-)join our rooms
      Chat.join(Chat.joinedRooms.join(' '), function () {
        console.log('init', 'joined rooms '+ Chat.joinedRooms);
      });
    });

    primus.on('error', function error(err) {
      console.error('error', 'An unknown error has occurred <code>'+ err.message +'</code>');
    });

    primus.on('data', function incoming(data) {
      switch (data.action) {
        case 'message':
          var existing = false;
          // check if message exists as pending
          Chat.unverifiedMessageIndexes.forEach(function (index, unverifiedIndex) {
            if (data.clientDate == Chat.messages[index].clientDate) {
              // found it! lets merge
              Chat.messages[index] = $.extend({}, Chat.messages[index], data);
              // remove unverified index
              Chat.unverifiedMessageIndexes.splice(unverifiedIndex, 1);

              existing = true;
              UI.refresh(); // force refresh
              return false;
            }
          });

          // Push onto list if doesn't already exist
          if (existing == false)
            Chat.messages.push(data);
          break;

        default:
        case 'raw':
          Chat.messages.push({
            date: performance.now(),
            source: 'system',
            message: data
          });
      }
    });

    primus.on('end', function end() {
      console.log('end', 'The connection has ended.');
      Chat.updateStatus('finished');
    });

    primus.on('close', function end() {
      console.log('close', 'We\'ve lost the connection to the server.');
    });
  }
}

// UI autonomy. Hopefully mostly abstracted framework
var UI = {
  init: function () {
    this.bindEvents();
  },
  bindEvents: function () {
    var $message = $('#message');

    var postMessage = function(ev) {
      if (ev.type != 'click') {
        if (ev.keyCode !== 13)
          return; // regular keypress
      }
      ev.preventDefault();
      Chat.message($message.val());
      $message.val('');
    }

    $('#message').on('keypress', postMessage);
    $('#btn-post').on('click', postMessage);
  },

  // render Room
  refresh: function() {
    React.renderComponent(
      // <MessageList />,
      MessageList({ messages: Chat.messages }),
      document.querySelector('#messageContainer')
    );
  }
}

var Webcam = {
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
    })
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
}

$(Chat.init.bind(Chat));
$(UI.init.bind(UI));
$(Webcam.init.bind(Webcam, '#webcamPreview'));

// well this is slightly convoluted, but it should work nicely enough
function random_name(seedString) {
  var firstNames = {
    "male": ["James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph", "Charles", "Thomas", "Christopher", "Daniel", "Matthew", "George", "Donald", "Anthony", "Paul", "Mark", "Edward", "Steven", "Kenneth", "Andrew", "Brian", "Joshua", "Kevin", "Ronald", "Timothy", "Jason", "Jeffrey", "Frank", "Gary", "Ryan", "Nicholas", "Eric", "Stephen", "Jacob", "Larry", "Jonathan", "Scott", "Raymond", "Justin", "Brandon", "Gregory", "Samuel", "Benjamin", "Patrick", "Jack", "Henry", "Walter", "Dennis", "Jerry", "Alexander", "Peter", "Tyler", "Douglas", "Harold", "Aaron", "Jose", "Adam", "Arthur", "Zachary", "Carl", "Nathan", "Albert", "Kyle", "Lawrence", "Joe", "Willie", "Gerald", "Roger", "Keith", "Jeremy", "Terry", "Harry", "Ralph", "Sean", "Jesse", "Roy", "Louis", "Billy", "Austin", "Bruce", "Eugene", "Christian", "Bryan", "Wayne", "Russell", "Howard", "Fred", "Ethan", "Jordan", "Philip", "Alan", "Juan", "Randy", "Vincent", "Bobby", "Dylan", "Johnny", "Phillip", "Victor", "Clarence", "Ernest", "Martin", "Craig", "Stanley", "Shawn", "Travis", "Bradley", "Leonard", "Earl", "Gabriel", "Jimmy", "Francis", "Todd", "Noah", "Danny", "Dale", "Cody", "Carlos", "Allen", "Frederick", "Logan", "Curtis", "Alex", "Joel", "Luis", "Norman", "Marvin", "Glenn", "Tony", "Nathaniel", "Rodney", "Melvin", "Alfred", "Steve", "Cameron", "Chad", "Edwin", "Caleb", "Evan", "Antonio", "Lee", "Herbert", "Jeffery", "Isaac", "Derek", "Ricky", "Marcus", "Theodore", "Elijah", "Luke", "Jesus", "Eddie", "Troy", "Mike", "Dustin", "Ray", "Adrian", "Bernard", "Leroy", "Angel", "Randall", "Wesley", "Ian", "Jared", "Mason", "Hunter", "Calvin", "Oscar", "Clifford", "Jay", "Shane", "Ronnie", "Barry", "Lucas", "Corey", "Manuel", "Leo", "Tommy", "Warren", "Jackson", "Isaiah", "Connor", "Don", "Dean", "Jon", "Julian", "Miguel", "Bill", "Lloyd", "Charlie", "Mitchell", "Leon", "Jerome", "Darrell", "Jeremiah", "Alvin", "Brett", "Seth", "Floyd", "Jim", "Blake", "Micheal", "Gordon", "Trevor", "Lewis", "Erik", "Edgar", "Vernon", "Devin", "Gavin", "Jayden", "Chris", "Clyde", "Tom", "Derrick", "Mario", "Brent", "Marc", "Herman", "Chase", "Dominic", "Ricardo", "Franklin", "Maurice", "Max", "Aiden", "Owen", "Lester", "Gilbert", "Elmer", "Gene", "Francisco", "Glen", "Cory", "Garrett", "Clayton", "Sam", "Jorge", "Chester", "Alejandro", "Jeff", "Harvey", "Milton", "Cole", "Ivan", "Andre", "Duane", "Landon"],
    "female": ["Mary", "Emma", "Elizabeth", "Minnie", "Margaret", "Ida", "Alice", "Bertha", "Sarah", "Annie", "Clara", "Ella", "Florence", "Cora", "Martha", "Laura", "Nellie", "Grace", "Carrie", "Maude", "Mabel", "Bessie", "Jennie", "Gertrude", "Julia", "Hattie", "Edith", "Mattie", "Rose", "Catherine", "Lillian", "Ada", "Lillie", "Helen", "Jessie", "Louise", "Ethel", "Lula", "Myrtle", "Eva", "Frances", "Lena", "Lucy", "Edna", "Maggie", "Pearl", "Daisy", "Fannie", "Josephine", "Dora", "Rosa", "Katherine", "Agnes", "Marie", "Nora", "May", "Mamie", "Blanche", "Stella", "Ellen", "Nancy", "Effie", "Sallie", "Nettie", "Della", "Lizzie", "Flora", "Susie", "Maud", "Mae", "Etta", "Harriet", "Sadie", "Caroline", "Katie", "Lydia", "Elsie", "Kate", "Susan", "Mollie", "Alma", "Addie", "Georgia", "Eliza", "Lulu", "Nannie", "Lottie", "Amanda", "Belle", "Charlotte", "Rebecca", "Ruth", "Viola", "Olive", "Amelia", "Hannah", "Jane", "Virginia", "Emily", "Matilda", "Irene", "Kathryn", "Esther", "Willie", "Henrietta", "Ollie", "Amy", "Rachel", "Sara", "Estella", "Theresa", "Augusta", "Ora", "Pauline", "Josie", "Lola", "Sophia", "Leona", "Anne", "Mildred", "Ann", "Beulah", "Callie", "Lou", "Delia", "Eleanor", "Barbara", "Iva", "Louisa", "Maria", "Mayme", "Evelyn", "Estelle", "Nina", "Betty", "Marion", "Bettie", "Dorothy", "Luella", "Inez", "Lela", "Rosie", "Allie", "Millie", "Janie", "Cornelia", "Victoria", "Ruby", "Winifred", "Alta", "Celia", "Christine", "Beatrice", "Birdie", "Harriett", "Mable", "Myra", "Sophie", "Tillie", "Isabel", "Sylvia", "Carolyn", "Isabelle", "Leila", "Sally", "Ina", "Essie", "Bertie", "Nell", "Alberta", "Katharine", "Lora", "Rena", "Mina", "Rhoda", "Mathilda", "Abbie", "Eula", "Dollie", "Hettie", "Eunice", "Fanny", "Ola", "Lenora", "Adelaide", "Christina", "Lelia", "Nelle", "Sue", "Johanna", "Lilly", "Lucinda", "Minerva", "Lettie", "Roxie", "Cynthia", "Helena", "Hilda", "Hulda", "Bernice", "Genevieve", "Jean", "Cordelia", "Marian", "Francis", "Jeanette", "Adeline", "Gussie", "Leah", "Lois", "Lura", "Mittie", "Hallie", "Isabella", "Olga", "Phoebe", "Teresa", "Hester", "Lida", "Lina", "Winnie", "Claudia", "Marguerite", "Vera", "Cecelia", "Bess", "Emilie", "John", "Rosetta", "Verna", "Myrtie", "Cecilia", "Elva", "Olivia", "Ophelia", "Georgie", "Elnora", "Violet", "Adele", "Lily", "Linnie", "Loretta", "Madge", "Polly", "Virgie", "Eugenia", "Lucile", "Lucille", "Mabelle", "Rosalie"]
  };
  var lastNames = ['Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Rodriguez', 'Lewis', 'Lee', 'Walker', 'Hall', 'Allen', 'Young', 'Hernandez', 'King', 'Wright', 'Lopez', 'Hill', 'Scott', 'Green', 'Adams', 'Baker', 'Gonzalez', 'Nelson', 'Carter', 'Mitchell', 'Perez', 'Roberts', 'Turner', 'Phillips', 'Campbell', 'Parker', 'Evans', 'Edwards', 'Collins', 'Stewart', 'Sanchez', 'Morris', 'Rogers', 'Reed', 'Cook', 'Morgan', 'Bell', 'Murphy', 'Bailey', 'Rivera', 'Cooper', 'Richardson', 'Cox', 'Howard', 'Ward', 'Torres', 'Peterson', 'Gray', 'Ramirez', 'James', 'Watson', 'Brooks', 'Kelly', 'Sanders', 'Price', 'Bennett', 'Wood', 'Barnes', 'Ross', 'Henderson', 'Coleman', 'Jenkins', 'Perry', 'Powell', 'Long', 'Patterson', 'Hughes', 'Flores', 'Washington', 'Butler', 'Simmons', 'Foster', 'Gonzales', 'Bryant', 'Alexander', 'Russell', 'Griffin', 'Diaz', 'Hayes', 'Myers', 'Ford', 'Hamilton', 'Graham', 'Sullivan', 'Wallace', 'Woods', 'Cole', 'West', 'Jordan', 'Owens', 'Reynolds', 'Fisher', 'Ellis', 'Harrison', 'Gibson', 'McDonald', 'Cruz', 'Marshall', 'Ortiz', 'Gomez', 'Murray', 'Freeman', 'Wells', 'Webb', 'Simpson', 'Stevens', 'Tucker', 'Porter', 'Hunter', 'Hicks', 'Crawford', 'Henry', 'Boyd', 'Mason', 'Morales', 'Kennedy', 'Warren', 'Dixon', 'Ramos', 'Reyes', 'Burns', 'Gordon', 'Shaw', 'Holmes', 'Rice', 'Robertson', 'Hunt', 'Black', 'Daniels', 'Palmer', 'Mills', 'Nichols', 'Grant', 'Knight', 'Ferguson', 'Rose', 'Stone', 'Hawkins', 'Dunn', 'Perkins', 'Hudson', 'Spencer', 'Gardner', 'Stephens', 'Payne', 'Pierce', 'Berry', 'Matthews', 'Arnold', 'Wagner', 'Willis', 'Ray', 'Watkins', 'Olson', 'Carroll', 'Duncan', 'Snyder', 'Hart', 'Cunningham', 'Bradley', 'Lane', 'Andrews', 'Ruiz', 'Harper', 'Fox', 'Riley', 'Armstrong', 'Carpenter', 'Weaver', 'Greene', 'Lawrence', 'Elliott', 'Chavez', 'Sims', 'Austin', 'Peters', 'Kelley', 'Franklin', 'Lawson', 'Fields', 'Gutierrez', 'Ryan', 'Schmidt', 'Carr', 'Vasquez', 'Castillo', 'Wheeler', 'Chapman', 'Oliver', 'Montgomery', 'Richards', 'Williamson', 'Johnston', 'Banks', 'Meyer', 'Bishop', 'McCoy', 'Howell', 'Alvarez', 'Morrison', 'Hansen', 'Fernandez', 'Garza', 'Harvey', 'Little', 'Burton', 'Stanley', 'Nguyen', 'George', 'Jacobs', 'Reid', 'Kim', 'Fuller', 'Lynch', 'Dean', 'Gilbert', 'Garrett', 'Romero', 'Welch', 'Larson', 'Frazier', 'Burke', 'Hanson', 'Day', 'Mendoza', 'Moreno', 'Bowman', 'Medina', 'Fowler', 'Brewer', 'Hoffman', 'Carlson', 'Silva', 'Pearson', 'Holland', 'Douglas', 'Fleming', 'Jensen', 'Vargas', 'Byrd', 'Davidson', 'Hopkins', 'May', 'Terry', 'Herrera', 'Wade', 'Soto', 'Walters', 'Curtis', 'Neal', 'Caldwell', 'Lowe', 'Jennings', 'Barnett', 'Graves', 'Jimenez', 'Horton', 'Shelton', 'Barrett', 'Obrien', 'Castro', 'Sutton', 'Gregory', 'McKinney', 'Lucas', 'Miles', 'Craig', 'Rodriquez', 'Chambers', 'Holt', 'Lambert', 'Fletcher', 'Watts', 'Bates', 'Hale', 'Rhodes', 'Pena', 'Beck', 'Newman', 'Haynes', 'McDaniel', 'Mendez', 'Bush', 'Vaughn', 'Parks', 'Dawson', 'Santiago', 'Norris', 'Hardy', 'Love', 'Steele', 'Curry', 'Powers', 'Schultz', 'Barker', 'Guzman', 'Page', 'Munoz', 'Ball', 'Keller', 'Chandler', 'Weber', 'Leonard', 'Walsh', 'Lyons', 'Ramsey', 'Wolfe', 'Schneider', 'Mullins', 'Benson', 'Sharp', 'Bowen', 'Daniel', 'Barber', 'Cummings', 'Hines', 'Baldwin', 'Griffith', 'Valdez', 'Hubbard', 'Salazar', 'Reeves', 'Warner', 'Stevenson', 'Burgess', 'Santos', 'Tate', 'Cross', 'Garner', 'Mann', 'Mack', 'Moss', 'Thornton', 'Dennis', 'McGee', 'Farmer', 'Delgado', 'Aguilar', 'Vega', 'Glover', 'Manning', 'Cohen', 'Harmon', 'Rodgers', 'Robbins', 'Newton', 'Todd', 'Blair', 'Higgins', 'Ingram', 'Reese', 'Cannon', 'Strickland', 'Townsend', 'Potter', 'Goodwin', 'Walton', 'Rowe', 'Hampton', 'Ortega', 'Patton', 'Swanson', 'Joseph', 'Francis', 'Goodman', 'Maldonado', 'Yates', 'Becker', 'Erickson', 'Hodges', 'Rios', 'Conner', 'Adkins', 'Webster', 'Norman', 'Malone', 'Hammond', 'Flowers', 'Cobb', 'Moody', 'Quinn', 'Blake', 'Maxwell', 'Pope', 'Floyd', 'Osborne', 'Paul', 'McCarthy', 'Guerrero', 'Lindsey', 'Estrada', 'Sandoval', 'Gibbs', 'Tyler', 'Gross', 'Fitzgerald', 'Stokes', 'Doyle', 'Sherman', 'Saunders', 'Wise', 'Colon', 'Gill', 'Alvarado', 'Greer', 'Padilla', 'Simon', 'Waters', 'Nunez', 'Ballard', 'Schwartz', 'McBride', 'Houston', 'Christensen', 'Klein', 'Pratt', 'Briggs', 'Parsons', 'McLaughlin', 'Zimmerman', 'French', 'Buchanan', 'Moran', 'Copeland', 'Roy', 'Pittman', 'Brady', 'McCormick', 'Holloway', 'Brock', 'Poole', 'Frank', 'Logan', 'Owen', 'Bass', 'Marsh', 'Drake', 'Wong', 'Jefferson', 'Park', 'Morton', 'Abbott', 'Sparks', 'Patrick', 'Norton', 'Huff', 'Clayton', 'Massey', 'Lloyd', 'Figueroa', 'Carson', 'Bowers', 'Roberson', 'Barton', 'Tran', 'Lamb', 'Harrington', 'Casey', 'Boone', 'Cortez', 'Clarke', 'Mathis', 'Singleton', 'Wilkins', 'Cain', 'Bryan', 'Underwood', 'Hogan', 'McKenzie', 'Collier', 'Luna', 'Phelps', 'McGuire', 'Allison', 'Bridges', 'Wilkerson', 'Nash', 'Summers', 'Atkins'];

  var primary = 0,
      secondary,
      name;

  for (var i = 0; i < seedString.length; i++) {
    primary += ( seedString.charCodeAt(i) * (i % 3) );
  }

  secondary = primary;
  for (var i = 0; i < (primary % seedString.length); i++) {
    secondary += ( seedString.charCodeAt(i) * (i % 3) );
  }

  if (primary & 2 == 0) {
    name = firstNames.male[primary % firstNames.male.length - 1];
  } else {
    name = firstNames.female[primary % firstNames.female.length - 1];
  }

  name += ' ' + lastNames[secondary % lastNames.length - 1];

  return name;
}

// modified performance shim
// adds random fractional amount to encourage uniqueness
window.performance = window.performance || {};
performance.now = (function() {
  return performance.now       ||
         performance.mozNow    ||
         performance.msNow     ||
         performance.oNow      ||
         performance.webkitNow ||
         function() {
           return (new Date().getTime() + Math.random());
         };
})();
