var viceroySuperAgent = require('../');
console.log(viceroySuperAgent({}));
var Viceroy = require('viceroy').Viceroy;
var Model = require('viceroy').Model;

var util = require('util');

var validConfig = {
  host: 'localhost',
  port: '27017',
  database: 'test'
};

describe('Viceroy Integration', function() {

  it('can load as middlware in viceroy', function(done) {
    var viceroy = new Viceroy;
    viceroy.use(viceroySuperAgent(validConfig));
    viceroy.connect(done);
  });

  describe('Model', function() {

    before(function(done) {
      this.viceroy = new Viceroy;
      this.viceroy.use(viceroySuperAgent(validConfig));
      this.viceroy.connect(done)
    })

    it('can create a model', function(done) {
      function Person(data) {
        Model.call(this, data);

        this.addSchema({
          name: String,
          age: Number,
          tags: Array
        });

        this.hasMany('friends', Person);
      }
      util.inherits(Person, Model);
      this.viceroy.model('People', Person);
      var person = new Person({
        name: 'Robert',
        age: 23,
        tags: ['software engineer', 'male']
      });
      person.save(function() {
        person._id.should.exist;
        done();
      });
    })

    it('can remove a model', function(done) {
      function Person(data) {
        Model.call(this, data);

        this.addSchema({
          name: String,
          age: Number,
          tags: Array
        });

        this.hasMany('friends', Person);
      }
      util.inherits(Person, Model);
      this.viceroy.model('People', Person);
      var person = new Person({
        name: 'Robert',
        age: 23,
        tags: ['software engineer', 'male']
      });
      person.save(function(err, person) {
        if(err) { throw err; }
        var id = person._id;
        person.remove(function(err) {
          if(err) { throw err; }
          (function() {
            person.data();
          }).should.throw();
          Person.findOne({ _id: id }, function(err, person) {
            if(err) { throw err; }
            (person === undefined).should.be.true;
            done();
          });
        });
      });
    })

    it('can update a model', function(done) {
      function Person(data) {
        Model.call(this, data);

        this.addSchema({
          name: String,
          age: Number,
          tags: Array
        });

        this.hasMany('friends', Person);
      }
      util.inherits(Person, Model);
      this.viceroy.model('People', Person);
      var person = new Person({
        name: 'Robert',
        age: 23,
        tags: ['software engineer', 'male']
      });
      person.save(function() {
        person.name = 'Shane';
        person.save(function() {
          person.name.should.equal('Shane');
          done();
        })
      });
    })

  })

})
