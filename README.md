
# Viceroy

## Control your empire

Battlefy introduces Viceroy. An ORM to rule them
all. Viceroy uses 'middleware' to connect its
models to their data sources. Any number of
middleware can be connected to Viceroy or it is
possible to read and write to many different
types of databases with a single instance of
Viceroy.

See the [Viceroy Repo](https://github.com/Battlefy/Viceroy) for more info.

# Viceroy SuperAgent

## Getting started

please stand by...

## Docs

please stand by...

## Example

```javascript

var viceroy = require('viceroy');
var viceroySuperAgent = require('viceroy-superagent');

viceroy.use(viceroySuperAgent({
  host: 'localhost',
  port: 0000,
  database: 'test'
}));

function Person(data) {
  Model.call(this, data);

  this.addSchema({
    name: String,
    age: Number,
    tags: Array
  });

  this.hasMany('friends', Person);
}


viceroy.model('person', Person);

viceroy.connect(function() {

  Person.find(query, function(err, people) {});
  Person.findOne(query, function(err, person) {});
  Person.count(query, function(err, count) {});


  var person = new Person({
    name: 'Robert',
    age: 23,
    tags: ['software engineer', 'male']
  });

  person.get(query, function(err) {});
  person.save(function(err) {});
  person.remove(function(err) {});
  person.data(data);
  person.data();

  person.friends(function(err, friends) {});
});

```
