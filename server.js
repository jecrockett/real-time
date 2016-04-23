// APP //

const express = require('express');
const Handlebars = require('handlebars');
const exphbs = require('express-handlebars');
const app = express();
const generateId = require('./lib/generate-id');
const cookieParser = require('cookie-parser');

app.set('port', process.env.PORT || 3000);
app.use(express.static('public'));
app.use(cookieParser());
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
app.set('polls', {});
var polls = app.get('polls');


app.get('/', (request, response) => {
  response.render('home');
});

app.get('/polls/:id', (request, response) => {
  if(!request.cookies.voterId) {
    var voterId = generateId(10);
    response.cookie('voterId', voterId);
  }
  response.render('public-poll');
});

app.get('/polls/:voteId/:adminId', (request, response) => {
  var voteId = request.params.voteId;
  var adminId = request.params.adminId;
  var pollData = polls[voteId];

  if (pollData.adminId === adminId) {
    response.render('admin-poll', {
      helpers: {
        pollData: function() { return countVotes(pollData.votes); }
      }
    });
  } else {
    response.sendStatus(404);
  }

});

// SERVER //

if (!module.parent) {
  const http = require('http');

  const server = http.createServer(app).listen(app.get('port'), () => {
    console.log(`Listening on port ${app.get('port')}.`);
  });

  module.exports = server;
} else {
  module.exports = app;
}

// function loggit() {
//   console.log(polls);
//   setTimeout(loggit, 1000);
// }
// loggit();
// WEBSOCKETS //

const socketIo = require('socket.io');
const io = socketIo(server);

io.on('connection', function (socket) {
  console.log('A user has connected.', io.engine.clientsCount);

  socket.on('message', (channel, message) => {
    if (channel === 'newPoll') {
      var voteId = generateId(3);
      var adminId = generateId(3);
      message.adminId = adminId;
      polls[voteId] = message;
      // function to generate link for admin view
      var adminLink = function() {
        return `http://localhost:3000/polls/${voteId}/${adminId}`;
      };
      // function to generate link in public view
      var voterLink = function() {
        return `http://localhost:3000/polls/${voteId}`;
      };
      // save the above into variables, send message back with those
      socket.emit('links', { admin: adminLink(), voter: voterLink() });
    }

    if (channel === 'newVote') {
      polls[message.voteId].votes[message.voterId] = message.content;

      console.log(polls);
      var time = new Date();
      socket.emit('yourVote', {vote: message.content, time: time.toLocaleString() });
      // socket.emit('voteStatus', countVotes(polls));
    }
  });

  socket.on('disconnect', function () {
    // delete polls[socket.id];
  });
});


// HELPERS //

Handlebars.registerHelper('list', function(votes) {
  a = "<div>";
  a = a + Object.keys(votes).forEach(appendVote.bind(votes));
  a = a + "</div>";
  return a;
});

function appendVote(option, index) {
  return `<p>${option}: ${this[option]}</p>`;
}

function countVotes(votes) {
  var voteCount = {};

  for (var vote in votes) {
    if (voteCount[votes[vote]]) {
      voteCount[votes[vote]]++;
    } else {
        voteCount[votes[vote]] = 1;
    }
  }
  return voteCount;
}
