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

      // create viceroy
      this.viceroy = new Viceroy;
      this.viceroy.driver(viceroyRest(validConfig));
      this.viceroy.connect(done);
    });

    before(function() {
      function Person(data) {
        Model.apply(this, arguments);
        this.schema({
          name: String,
          age: Number
        });
        this.hasMany(Person, {getterPath: 'friends', nested: true});
        this.hasOne(Person, {getterPath: 'friend', nested: 'friends'});
      }
      util.inherits(Person, Model);
      this.viceroy.model(Person);

      this.Person = Person;
    });

    it('can create a model', function(done) {
      nock('http://localhost:8000')
        .post('/people')
        .reply(200, [{_id: 1, name: 'Shane', age: 25}, {_id: 2, name: 'Robert', age: 24}], {'Content-Type': 'application/json'});


      var person = new this.Person({
        name: 'Shane',
        age: 25,
      });
      person.save(function(err) {
        person._id.should.equal(1);
        person.age.should.equal(25);
        person.name.should.equal('Shane');
        done();
      });
    })

    it('can remove a model', function(done) {
      var _this = this;

      nock('http://localhost:8000')
        .post('/people')
        .reply(200, [{_id: 1, name: 'Shane', age: 25}], {'Content-Type': 'application/json'});
      nock('http://localhost:8000')
        .delete('/people/1')
        .reply(200, {}, {'Content-Type': 'application/json'});
      nock('http://localhost:8000')
        .get('/people')
        .reply(200, [], {'Content-Type': 'application/json'});


      var person = new this.Person({
        name: 'Shane',
        age: 25,
        _id: 1
      });

      person.save(function(err, person) {
        if(err) { throw err; }
        var id = person._id;
        person.remove(function(err) {
          if(err) { throw err; }
          _this.Person.findOne({ _id: id }, function(err, person) {
            err.should.be.OK;
            done();
          });
        });
      });
    })

    it('can update a model', function(done) {

      nock('http://localhost:8000')
        .post('/people')
        .reply(200, [{_id: 1, name: 'Shane', age: 25}], {'Content-Type': 'application/json'});
      nock('http://localhost:8000')
        .put('/people/1')
        .reply(200, {name: 'Herp'}, {'Content-Type': 'application/json'});

      var person = new this.Person({
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
        .get('/people')
        .reply(200, [
          {
            _id: 123,
            name: 'Herp',
            friendIDs: ['124', '125']
          }
        ],{ 'Content-Type': 'application/json' });
      nock('http://localhost:8000')
        .get('/people/123/friends')
        .reply(200, [
          {_id: 124, name: 'Derp'},
          {_id: 125, name: 'Billy'}
        ], {'Content-Type': 'application/json'});

      this.Person.findOne({_id: 123, $populate: ['friends']}, function(err, result) {
        if(err) { return done(err); }
        result.friends.length.should.equal(2);
        done()
      });
    });

    it('can $populate a nested model with a hasMany resource route', function(done) {

      nock('http://localhost:8000')
        .get('/people')
        .reply(200, [{_id: 123, name: 'Herp', friendIDs: ['124']}], {'Content-Type': 'application/json'});
      nock('http://localhost:8000')
        .get('/people/123/friends')
        .reply(200, [{_id: 124, name: 'Derp'}], {'Content-Type': 'application/json'});

      this.Person.findOne({_id: 123, $populate: ['friends']}, function(err, result){
        result.friends[0].name.should.equal('Derp');
        result.friends.length.should.equal(1);
        done();
      });
    })

    it('can $populate a nested model with a hasOne resource route', function(done) {

      nock('http://localhost:8000')
        .get('/people')
        .reply(200, [{_id: 123, name: 'Herp', friendID: 124}], {'Content-Type': 'application/json'});
      nock('http://localhost:8000')
        .get('/people/123/friends')
        .reply(200, [{_id: 124, name: 'Derp'}], {'Content-Type': 'application/json'});

      this.Person.findOne({_id: 123, $populate: ['friend']}, function(err, result){
        result.friend.name.should.equal('Derp');
        done()
      });
    })

    it('can insert a nested model with a hasOne resource route', function(done) {

      nock('http://localhost:8000')
        .get('/people')
        .reply(200, [{_id: 123, name: 'Herp'}], {'Content-Type': 'application/json'});
      nock('http://localhost:8000')
        .post('/people/123/friends')
        .reply(200, [{_id: 124, name: 'Derp', age: 12}], {'Content-Type': 'application/json'});

      this.Person.findOne({_id: 123}, function(err, person) {
        person.friend.create({ name: 'Derp', age: 12 }, function(err, friend) {
          if (err) { throw err; }
          friend.name.should.equal('Derp');
          friend.age.should.equal(12);
          done()
        })
      });
    })

    it('can insert a nested model with a hasMany resource route', function(done) {

      nock('http://localhost:8000')
        .get('/people')
        .reply(200, [{_id: 123, name: 'Herp'}], {'Content-Type': 'application/json'});
      nock('http://localhost:8000')
        .post('/people/123/friends')
        .reply(200, [{_id: 124, name: 'Derp'}], {'Content-Type': 'application/json'});

      this.Person.findOne({_id: 123 }, function(err, person){
        person.friends.create({ name: 'Derp' }, function(err, friend){
          if (err) { throw err; }
          friend.name.should.equal('Derp');
          done()
        })
      });
    });
  });
});
