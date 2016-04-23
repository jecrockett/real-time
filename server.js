// APP //

const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const generateId = require('./lib/generate-id');
const Poll = require('./lib/poll');


app.set('port', process.env.PORT || 3000);
app.use(express.static('public'));
app.use(cookieParser());
app.set('view engine', 'ejs');
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

  var pollData = polls[request.params.id];

  response.render('public-poll', { pollData: pollData, votes: pollData.countVotes(pollData.options, pollData.votes)});
});

app.get('/polls/:voteId/:adminId', (request, response) => {
  var adminId = request.params.adminId;
  var voteId = request.params.voteId;
  var pollData = polls[voteId];
  console.log(pollData.options);
  if (pollData.adminId === adminId) {
    response.render('admin-poll', { pollData: pollData, votes: pollData.countVotes(pollData.options, pollData.votes) } );
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
//
// function loggit(thing) {
//   console.log(thing);
//   setTimeout(loggit(thing), 1000);
// }
// loggit(polls);

// WEBSOCKETS //

const socketIo = require('socket.io');
const io = socketIo(server);

io.on('connection', function (socket) {
  console.log('A user has connected.', io.engine.clientsCount);

  socket.on('message', (channel, message) => {
    if (channel === 'newPoll') {
      var pollId = generateId(3);
      var adminId = generateId(3);
      var newPoll = new Poll(message.question, message.options, adminId);

      polls[pollId] = newPoll;
      // function to generate link for admin view
      var adminLink = function() {
        return `http://localhost:3000/polls/${pollId}/${adminId}`;
      };
      // function to generate link in public view
      var voterLink = function() {
        return `http://localhost:3000/polls/${pollId}`;
      };
      // save the above into variables, send message back with those
      socket.emit('links', { admin: adminLink(), voter: voterLink() });
    }

    if (channel === 'newVote') {
      polls[message.pollId].votes[message.voterId] = message.content;

      var time = new Date();
      socket.emit('yourVote', {vote: message.content, time: time.toLocaleString() });
    }

    if (channel === 'deactivatePoll') {
      var poll = polls[message];
      poll.active = false;
      socket.emit('pollDeactivated', "Poll deactivated");
    }
  });

  socket.on('disconnect', function () {
    // delete polls[socket.id];
  });
});
