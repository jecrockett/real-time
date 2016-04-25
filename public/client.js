$(document).ready(function() {

/////////////// SOCKET CONNECTION ///////////////////
  const socket = io();

/////////////// VARIABLE ASSIGNMENT ///////////////////
  const currentPoll = document.location.href.split('/')[4];

/////////////// WEBSOCKET LISTENERS ///////////////////

  //===== HOME =====//
  socket.on('links', (links) => {
    $('#admin-link').html(links.admin);
    $('#voter-link').html(links.voter);

    $('.new-poll').slideUp();
    $('.new-poll').promise().done(function() {
      $('.new-links').slideDown();
    }).promise().done(function() {
      $('.create-poll-button-container').fadeIn();
    });
  });

  //===== ADMIN PAGE =====//
  socket.on('pollDeactivated', (message) => {
    $('#expiration-message').html(message);
  });

  socket.on('confirmDeadline', (message) => {
    $('#time-selector-container').slideUp();
    $('#expiration-message').html(message);
  });

  //===== VOTER PAGE =====//
  socket.on('yourVote', (info) => {
    $('#your-vote').html(`You voted for ${info.vote} (${info.time})`);
  });

  socket.on('tooLate', (info) => {
    $('#sorry-message').html(info);
  });

  socket.on('deactivation', (deactivatedPoll) => {
    if (deactivatedPoll.id === currentPoll) {
      $('#choices').empty()
                   .append("<p>Voting for this poll has closed.</p>");
    }
  });

  //===== SHARED =====//
  socket.on('updatedVote', (info) => {
    if (info.pollId === currentPoll) {
      $('#vote-status ul').empty();
      appendVotes(info.votes);
    }
  });


//////////////// CLICK LISTENERS ///////////////////

  //===== HOME =====//
  $('#create-poll').on('click', function() {
    $('.new-links').fadeOut();
    $('.create-poll-button-container').fadeOut();
    $('.create-poll-button-container').promise().done(function() {
      $('.new-poll').slideDown();
    });

  });

  $('#add-another-option').on('click', function() {
    $('.poll-options').append(
      '<input type="text" placeholder="Add another possible answer">'
    );
  });

  $('#vote-deadline').on('change', () => {
    $('#time-selector-container').slideToggle();
  });

  $('#create-new-poll').on('click', () => {
    let pollData = { options: [] };
    gatherPollInfo(pollData);

    socket.send('newPoll', pollData);
  });

  //===== ADMIN PAGE =====//
  $('#set-new-deadline').on('click', function() {
    $('#time-selector-container').slideToggle();
  });

  $('#deactivate-poll').on('click', function() {
    socket.send('deactivatePoll', currentPoll );
  });

  $('#submit-new-expiration').on('click', function() {
    let expiration = $('#time-selector').val();
    socket.send('updateDeadline', {pollId: currentPoll, expiration: expiration});
  });

  //===== VOTER PAGE =====//
  var buttons = document.querySelectorAll('#choices button');
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener('click', sendVote);
  }


//////////////// HELPERS ///////////////////

  //===== HOME =====//
  function gatherPollInfo(pollData) {
    pollData.question = $('.poll-question input').val();
    pollData.shareResults = ($('#public-results').prop('checked'));
    pollData.expiration = getInitialExpiration();
    populatePollOptions(pollData);
  }

  function getInitialExpiration() {
    if ($('#vote-deadline').prop('checked')) {
      return $('#time-selector').val();
    } else {
      return null;
    }
  }

  function populatePollOptions(pollData) {
    $('.poll-options input').each(function() {
      let option = $(this).val().trim();
      if (option.length > 0) {
        pollData.options.push(option);
      }
    });
  }

  //===== VOTER PAGE =====//
  function sendVote() {
    let voterId = getCookie('voterId');
    socket.send('newVote', {pollId: currentPoll, voterId: voterId, content: this.innerText});
  }

  function getCookie(name) {
    var value = "; " + document.cookie;
    var parts = value.split("; " + name + "=");
    if (parts.length == 2) return parts.pop().split(";").shift();
  }

  //===== SHARED =====//
  function appendVotes(votes) {
    Object.keys(votes).forEach(function(option, index) {
      $('#vote-status ul').append(`<li>${option}: ${votes[option]}</li>`);
    });
  }

});
