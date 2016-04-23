function Poll(question, options, adminId) {
  this.active = true;
  this.question = question;
  this.options = options;
  this.adminId = adminId;
  this.votes = {};
}

Poll.prototype = {
  countVotes: function(options, votes) {
    var voteCount = {};

    options.forEach(function(option, index) {
      voteCount[option] = 0;
    });

    for (var vote in votes) {
      voteCount[votes[vote]]++;
    }

    return voteCount;
  }
};

module.exports = Poll;
