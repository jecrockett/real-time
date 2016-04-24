function Poll(question, options, pollId, adminId, shareResults, expiration) {
  this.active = true;
  this.id = pollId;
  this.adminId = adminId;
  this.question = question;
  this.options = options;
  this.shareResults = shareResults;
  this.expiration = expiration;
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
