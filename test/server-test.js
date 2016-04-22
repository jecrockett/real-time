const assert = require('chai').assert;
const app = require('../server');
const request = require('request');

describe('Server', () => {

  before(done => {
    this.port = 8712;
    this.server = app.listen(this.port, (error, response) => {
      if (error) { return done(error); }
      done();
    });

    this.request = request.defaults({
      baseUrl: 'http://localhost:8712/'
    });
  });

  after(() => {
    this.server.close();
  });

  describe('GET /', () => {
    it('should return a 200', (done) => {
      this.request.get('/', (error, response) => {
        if (error) { done(error); }
        assert.equal(response.statusCode, 200);
        done();
      });
    });

    
  });
});
