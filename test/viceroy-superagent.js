var viceroySuperAgent = require('../');
var Fixture = require('arboria');

var sinon = require('sinon');

var invalidConfig = { bad: 'data' };
var validConfig = {};

describe('middleware', function() {

  it('passes the callback an error if it failed to initialize', function(done) {
    var middleware = viceroySuperAgent(invalidConfig);
    middleware.connect(function(err) {
      (!!err).should.be.OK;
      // err.should.be.an.instanceOf(Error);
      done()
    });
  });

  it('can connect to mongodb', function(done) {
    var middleware = viceroySuperAgent(validConfig);
    middleware.connect(done);
  });

  describe('methods', function(){

    before(function(done){
      var _this = this;
      this.middleware = viceroySuperAgent(validConfig);
      this.middleware.connect(done);
    })

    it('has a find method that calls into superagent', function(done) {
      var modelName = 'People'
      var query = { name: 'Shane'};
      var callback = sinon.spy();
      this.middleware.find.should.be.a('function');
      this.middleware.find(modelName, query, function (err, results) {
        if (err) { throw err };
        results.length.should.equal(1);
        results[0].should.include({ name: 'Shane', age: 25 });
        done();
      })
    });

    it('implements a findOne method that calls out to superagent', function(done) {
      var _this = this;
      var modelName = 'People'
      var query = { name: 'Shane'};
      this.middleware.findOne.should.be.a('function');
      this.middleware.findOne(modelName, query, function(err, result){
        if (err) { throw err };
        result.should.include({ name: 'Shane', age: 25 });
        done();
      });
    });

    it('implements a save method that calls out to superagent', function(done) {
      var _this = this;
      var modelName = 'People'
      var data = { name: 'Shane', age: 26 };
      this.middleware.save.should.be.a('function');
      this.middleware.save(modelName, data, function(err){
        if (err) { throw err };
        done();
      });
    });

    it('implements a remove method that calls out to superagent', function(done) {
      var _this = this;
      var modelName = 'People'
      var query = { name: 'Shane', age: 26 };

      this.middleware.findOne(modelName, query, function (err, result) {
        _this.middleware.remove.should.be.a('function');
        _this.middleware.remove(modelName, result, function(err){
          if (err) { throw err };
          done();
        });
      })

    });

    it('implements a count method that calls out to mongodb', function(done) {
      var _this = this;
      var modelName = 'People'
      var query = { name: 'Shane', age: 25 };

      this.middleware.findOne(modelName, query, function (err, result) {
        _this.middleware.count.should.be.a('function');
        _this.middleware.count(modelName, result, function(err, tokens){
          if (err) { throw err };
          tokens.length.should.equal(1);
          done();
        });
      })

    });

  })

});
