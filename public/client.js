const socket = io();

var connectionCount = document.getElementById('connection-count');
var statusMessage = document.getElementById('status-message');
var voteStatus = document.getElementById('vote-status');
var yourVote = document.getElementById('your-vote');
var buttons = document.querySelectorAll('#choices button');


for (var i = 0; i < buttons.length; i++) {
  buttons[i].addEventListener('click', sendVote);
}

socket.on('usersConnected', (count) => {
  connectionCount.innerText = 'Connected Users: ' + count;
});

socket.on('statusMessage', (message) => {
  statusMessage.innerText = message;
});

socket.on('voteStatus', (votes) => {
  voteStatus.innerHTML = '';
  Object.keys(votes).forEach(appendVote.bind(votes));
});

socket.on('yourVote', (info) => {
  yourVote.innerText = `You voted for ${info.vote} at ${info.time}.`;
});

socket.on('pollDeactivated', (message) => {
  statusMessage.innerText = message;
});

socket.on('links', (links) => {
  $('#admin-link')[0].innerText = links.admin;
  $('#voter-link')[0].innerText = links.voter;

  $('.new-poll').slideUp();
  $('.new-links').slideDown();
});

function sendVote() {
  var pollID = document.location.href.split('/')[4];
  // let voterId = getCookie('voterId');

  socket.send('newVote', {pollId: pollID, voterId: socket.id, content: this.innerText});
}

function appendVote(option, index) {
  let newElem = document.createElement("li");
  newElem.innerHTML = option + ": " + this[option];
  voteStatus.appendChild(newElem);
}

$('#create-poll').on('click', function() {
  $('.new-poll').slideDown();
});

$('#deactivate-poll').on('click', function() {
  var pollId = document.location.href.split('/')[4];
  socket.send('deactivatePoll', pollId );
});

$('#add-another-option').on('click', function() {
  $('.poll-options').append('<input type="text" placeholder="Add another possible answer">');
});

$('#create-new-poll').on('click', () => {
  let pollData = {question: '', options: [] };

  pollData.question = $('.poll-question input').val();
  $('.poll-options input').each(function() {
    pollData.options.push($(this).val());
  });

  socket.send('newPoll', pollData);
});

// HELPERS //
function getCookie(name) {
  var value = "; " + document.cookie;
  var parts = value.split("; " + name + "=");
  if (parts.length == 2) return parts.pop().split(";").shift();
}
