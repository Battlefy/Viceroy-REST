var viceroyRest = require('../');
var Viceroy = require('viceroy').Viceroy;
var Model = require('viceroy').Model;
var nock = require('nock');

var util = require('util');

var validConfig = {
  host: 'localhost',
  port: '8000',
};

describe('Viceroy Integration', function() {

  it('can load as middlware in viceroy', function(done) {
    var viceroy = new Viceroy;
    viceroy.driver(viceroyRest(validConfig));
    viceroy.connect(done);
  });

  describe('Model', function() {

    before(function(done) {
      this.viceroy = new Viceroy;
      this.viceroy.driver(viceroyRest(validConfig));
      this.viceroy.connect(done)
    })

    it('can create a model', function(done) {
      nock('http://localhost:8000')
        .post('/people')
        .reply(200, {_id: 1, name: 'Shane', age: 25}, {'Content-Type': 'application/json'});

      function Person(data) {
        Model.call(this, data);

        this.schema({
          name: String,
          age: Number,
          tags: Array
        });
      }
      util.inherits(Person, Model);
      this.viceroy.model(Person);
      var person = new Person({
        name: 'Shane',
        age: 25,
      });
      person.save(function(err) {
        person._id.should.exist;
        done();
      });
    })

    it('can remove a model', function(done) {
      nock('http://localhost:8000')
        .post('/people')
        .reply(200, {_id: 1, name: 'Shane', age: 25}, {'Content-Type': 'application/json'});
      nock('http://localhost:8000')
        .delete('/people/1')
        .reply(200, {}, {'Content-Type': 'application/json'});
      nock('http://localhost:8000')
        .get('/people/1')
        .reply(404);
      function Person(data) {
        Model.call(this, data);

        this.schema({
          name: String,
          age: Number,
          tags: Array
        });
      }
      util.inherits(Person, Model);
      this.viceroy.model(Person);
      var person = new Person({
        name: 'Shane',
        age: 25,
        _id: 1
      });
      person.save(function(err, person) {
        if(err) { throw err; }
        var id = person._id;
        person.remove(function(err) {
          if(err) { throw err; }
          Person.findOne({ _id: id }, function(err, person) {
            if(err) { throw err; }
            (!person._id).should.be.true;
            done();
          });
        });
      });
    })

    it('can update a model', function(done) {
      nock('http://localhost:8000')
        .post('/people')
        .reply(200, {_id: 1, name: 'Shane', age: 25}, {'Content-Type': 'application/json'});
      nock('http://localhost:8000')
        .put('/people/1')
        .reply(200, {name: 'Herp'}, {'Content-Type': 'application/json'});

      function Person(data) {
        Model.call(this, data);

        this.schema({
          name: String,
          age: Number,
          tags: Array
        });

      }
      util.inherits(Person, Model);
      this.viceroy.model(Person);
      var person = new Person({
        name: 'Shane',
        age: 25,
        _id: 1
      });
      person.save(function() {
        person.name = 'Herp';
        person.save(function() {
          person.name.should.equal('Herp');
          done();
        })
      });
    })

    it('can find a model with $populate', function(done) {

      nock('http://localhost:8000')
        .get('/people/123')
        .reply(200, {name: 'Herp', friendIDs: ['124']}, {'Content-Type': 'application/json'});

      nock('http://localhost:8000')
        .get('/people')
        .reply(200, [{name: 'Derp'}], {'Content-Type': 'application/json'});

      function Person(data) {
        Model.call(this, data);

        this.schema({
          name: String,
          age: Number,
          tags: Array
        });

        this.hasMany(Person, 'friends');
      }
      util.inherits(Person, Model);

      this.viceroy.model(Person);

      Person.findOne({_id: 123, $populate: ['friends']}, function(err, result){
        result.friends.length.should.equal(1);
        done()
      });
    })

  })

})
