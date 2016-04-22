// APP //

const express = require('express');
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
      polls[voteId] = message;
      // function to generate link for admin view
      var adminLink = function() {
        return `http://localhost:3000/polls/${adminId}`;
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

      // polls[socket.id] = message;
      var time = new Date();
      socket.emit('yourVote', {vote: message, time: time.toLocaleString() });
      // socket.emit('voteStatus', countVotes(polls));
    }
  });

  socket.on('disconnect', function () {
    // delete polls[socket.id];
  });
});

function countVotes(votes) {
var voteCount = {
    A: 0,
    B: 0,
    C: 0,
    D: 0
};
  for (var vote in votes) {
    voteCount[votes[vote]]++;
  }
  return voteCount;
}
