var viceroyRest = require('../');
var nock = require('nock');

var sinon = require('sinon');

var invalidConfig = { bad: 'data' };
var validConfig = {
  host: 'localhost',
  port: '8000'
};

describe('middleware', function() {

  it('passes the callback an error if it failed to initialize', function(done) {
    var middleware = viceroyRest(invalidConfig);
    middleware.connect(function(err) {
      (!!err).should.be.OK;
      err.should.be.an.instanceOf(Error);
      done()
    });
  });

  it('can connect', function(done) {
    var middleware = viceroyRest(validConfig);
    middleware.connect(done);
  });

  it('can take option withCredentials', function(done) {
    var config = {
      host: 'localhost',
      port: '8000',
      withCredentials: true
    }
    var middleware = viceroyRest(config);
    middleware.connect(done);
  });

  describe('methods', function(){

    before(function(done){
      var _this = this;
      this.middleware = viceroyRest(validConfig);
      this.middleware.connect(done);
    })

    it('has a find method that calls into http', function(done) {
      nock('http://localhost:8000')
        .get('/people')
        .reply(200, [{name: 'Shane', age: 25}], {'Content-Type': 'application/json'});

      var collection = 'people'
      var query = { name: 'Shane'};
      var callback = sinon.spy();
      this.middleware.find.should.be.a('function');
      this.middleware.find(query, {collection: collection}, function (err, results) {
        if (err) { throw err };
        results.length.should.equal(1);
        results[0].should.eql({ name: 'Shane', age: 25 });
        done();
      })
    });

    it('implements a findOne method that calls out to http', function(done) {
      nock('http://localhost:8000')
        .get('/people/1')
        .reply(200, {name: 'Shane', age: 25}, {'Content-Type': 'application/json'});

      var _this = this;
      var collection = 'people';
      var query = { _id: 1 };
      this.middleware.findOne.should.be.a('function');
      this.middleware.findOne(query, {collection: collection}, function(err, result){
        if (err) { throw err };
        result.should.eql({ name: 'Shane', age: 25 });
        done();
      });
    });

    it('implements an insert method that calls out to http', function(done) {
      nock('http://localhost:8000')
        .post('/people')
        .reply(200, {name: 'Shane', age: 26}, {'Content-Type': 'application/json'});

      var _this = this;
      var collection = 'people'
      var data = { name: 'Shane', age: 26 };
      this.middleware.insert.should.be.a('function');
      this.middleware.insert(data, {collection: collection}, function(err, result){
        if (err) { throw err };
        result.should.eql(data);
        done();
      });
    });

    it('implements a remove method that calls out to http', function(done) {
      nock('http://localhost:8000')
        .delete('/people/1')
        .reply(200, {}, {'Content-Type': 'application/json'});
      var _this = this;
      var collection = 'people';
      var query = { _id: 1, name: 'Shane', age: 26 };
      _this.middleware.removeOne.should.be.a('function');
      _this.middleware.removeOne(query, {collection: collection}, function(err){
        if (err) { throw err };
        done();
      });

    });

  });

});
