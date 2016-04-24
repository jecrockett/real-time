$(document).ready(function() {
  const socket = io();

  var buttons = document.querySelectorAll('#choices button');
  var currentPoll = document.location.href.split('/')[4];

  for (var i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener('click', sendVote);
  }

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







  socket.on('confirmDeadline', (message) => {
    $('#time-selector-container').slideUp();
    $('#expiration-message').html(message);
  });

  socket.on('voteStatus', (votes) => {
    $('#vote-status').empty();
    Object.keys(votes).forEach(appendVote.bind(votes));
  });

  socket.on('yourVote', (info) => {
    $('#your-vote').html(`You voted for ${info.vote} (${info.time})`);
  });

  socket.on('tooLate', (info) => {
    $('#sorry-message').html(info);
  });

  socket.on('updatedVote', (info) => {
    if (info.pollId === document.location.href.split('/')[4]) {
      $('#vote-status ul').empty();

      Object.keys(info.votes).forEach(function(option, index) {
        $('#vote-status ul').append(`<li>${option}: ${info.votes[option]}</li>`);
      });
    }

  });

  socket.on('pollDeactivated', (message) => {
    statusMessage.innerText = message;
  });

  socket.on('deactivation', (deactivatedPoll) => {
    if (deactivatedPoll.id === document.location.href.split('/')[4]) {
      $('#choices').empty();
      $('#choices').append("<p>Voting for this poll has closed.</p>");
    }
  });

  socket.on('links', (links) => {
    $('#admin-link')[0].innerText = links.admin;
    $('#voter-link')[0].innerText = links.voter;

    $('.new-poll').slideUp();
    $('.new-poll').promise().done(function() {
      $('.new-links').slideDown();
    });
  });










  $('#create-poll').on('click', function() {
    $('.new-links').fadeOut();
    $('.new-poll').slideDown();
  });

  $('#deactivate-poll').on('click', function() {
    var pollId = document.location.href.split('/')[4];
    socket.send('deactivatePoll', pollId );
  });

  $('#add-another-option').on('click', function() {
    $('.poll-options').append('<input type="text" placeholder="Add another possible answer">');
  });

  $('#vote-deadline').on('change', () => {
    let $container = $('#time-selector-container');
    if ($('#vote-deadline').prop('checked')) {
      $container.slideDown();
    } else {
      $container.slideUp();
    }
  });

  $('#set-new-deadline').on('click', function() {
    $('#time-selector-container').slideToggle();
  });

  $('#submit-new-expiration').on('click', function() {
    var pollId = document.location.href.split('/')[4];
    let expiration = $('#time-selector').val();
    console.log(pollId, expiration);
    socket.send('updateDeadline', {pollId: pollId, expiration: expiration});
  });

  $('#create-new-poll').on('click', () => {
    let pollData = { options: [] };

    pollData.question = $('.poll-question input').val();
    pollData.shareResults = ($('#public-results').prop('checked'));

    if ($('#vote-deadline').prop('checked')) {
      pollData.expiration = $('#time-selector').val();
    } else {
      pollData.expiration = null;
    }

    $('.poll-options input').each(function() {
      let option = $(this).val();
      if (option.length > 0) {
        pollData.options.push($(this).val());
      }
    });

    socket.send('newPoll', pollData);
  });



  // HELPERS //
  function getCookie(name) {
    var value = "; " + document.cookie;
    var parts = value.split("; " + name + "=");
    if (parts.length == 2) return parts.pop().split(";").shift();
  }
});
