//////////////// APP SETUP ///////////////////

const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const generateId = require('./lib/generate-id');
const Poll = require('./lib/poll');


app.set('port', process.env.PORT || 3000);
app.use(express.static(__dirname + '/public'));
app.use(cookieParser());
app.set('view engine', 'ejs');
app.set('polls', {});

var polls = app.get('polls');

/////////////////// ROUTES ///////////////////
app.get('/', (request, response) => {
  response.render('home');
});

app.get('/polls/:id', (request, response) => {
  if(!request.cookies.voterId) {
    var voterId = generateId(10);
    response.cookie('voterId', voterId);
  }

  var poll = polls[request.params.id];

  (poll.shareResults) ?
    response.render('public-poll', { poll: poll, votes: poll.countVotes(poll.options, poll.votes)}) :
    response.render('public-poll', { poll: poll, votes: {"Note": "The vote administrator has elected to keep the results private."} });
});

app.get('/polls/:voteId/:adminId', (request, response) => {
  var adminId = request.params.adminId;
  var voteId = request.params.voteId;
  var poll = polls[voteId];

  if (poll.adminId === adminId) {
    response.render('admin-poll', { poll: poll, votes: poll.countVotes(poll.options, poll.votes) } );
  } else {
    response.sendStatus(404);
  }

});


/////////////////// START SERVER ///////////////////

if (!module.parent) {
  const http = require('http');

  const server = http.createServer(app).listen(app.get('port'), () => {
    console.log(`Listening on port ${app.get('port')}.`);
  });

  module.exports = server;
} else {
  module.exports = app;
}


/////////////////// WEBSOCKETS ///////////////////

const socketIo = require('socket.io');
const io = socketIo(server);

io.on('connection', function (socket) {
  socket.on('message', (channel, message) => {
    newPoll(channel, message, socket);
    newVote(channel, message, socket);
    deactivatePoll(channel, message, socket);
    updateDeadline(channel, message, socket);
  });
});

////////////// SOCKET MESSAGE HANDLING /////////////////

function newPoll(channel, message, socket) {
  if (channel === 'newPoll') {
    var pollId = generateId(3);
    var adminId = generateId(3);
    var expiration = setExpiration(message.expiration);

    var newPoll = new Poll(message.question, message.options, pollId, adminId, message.shareResults, expiration);
    polls[pollId] = newPoll;

    socket.emit('links', { admin: adminLink(pollId, adminId), voter: voterLink(pollId) });
  }
}

function newVote(channel, message, socket) {
  if (channel === 'newVote') {
    var poll = polls[message.pollId];

    if (!poll.expiration || poll.expiration > Date.now()) {
      poll.votes[message.voterId] = message.content;

      socket.emit('yourVote', {vote: message.content, time: new Date().toLocaleString() });
      sendAvailableVoteData(poll);
    } else {
      poll.active = false;
      var closingTime = new Date(poll.expiration);

      socket.emit('tooLate', `Sorry, this poll closed at ${closingTime.toLocaleString() }` );
    }
  }
}

function deactivatePoll(channel, message, socket) {
  if (channel === 'deactivatePoll') {
    var pollToDeactivate = polls[message];
    pollToDeactivate.active = false;

    socket.emit('pollDeactivated', "Poll deactivated");
    io.sockets.emit('deactivation', pollToDeactivate);
  }
}

function updateDeadline(channel, message, socket) {
  if (channel === 'updateDeadline') {
    var pollToUpdate = polls[message.pollId];
    pollToUpdate.expiration = new Date(message.expiration).getTime();

    socket.emit('confirmDeadline', `The deadline is now ${ new Date(pollToUpdate.expiration).toLocaleString() }.`);
  }
}


//////////////// HELPERS /////////////////

  function adminLink(pollId, adminId) {
    return `http://localhost:3000/polls/${pollId}/${adminId}`;
  }

  function voterLink(pollId) {
    return `http://localhost:3000/polls/${pollId}`;
  }

  function setExpiration(value) {
    if (value) {
      return new Date(value).getTime();
    } else {
      return null;
    }
  }

  function sendAvailableVoteData(poll) {
    if (poll.shareResults) {
      io.sockets.emit('updatedVote', {pollId: poll.id, votes: poll.countVotes(poll.options, poll.votes) });
    } else {
      io.sockets.emit('updatedVote', {pollId: poll.id, votes: {"Note": "The vote administrator has elected to keep the results private."}});
    }
  }
