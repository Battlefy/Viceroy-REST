# Viceroy Rest Driver

## Control your empire

Battlefy introduces Viceroy. An ORM to rule them
all. Viceroy uses 'middleware' to connect its
models to their data sources. Any number of
middleware can be connected to Viceroy or it is
possible to read and write to many different
types of databases with a single instance of
Viceroy.

See the [Viceroy Repo](https://github.com/Battlefy/Viceroy) for more info.

# Viceroy Rest

## Getting started
This is a driver for making http requests to a rest server, preferably
one powered by viceroy. This works in both node and in the browser.
Check out the package.json for browserify build examples.

## Config

Config to Viceroy-Rest should include the following configs:

```javascript
viceroy.driver(viceroyRest({
  host: 'localhost', //required
  port: 8000, // optional
  beforeSend: function(data) { // optional
    return data;
  }
}));
```

## Example

```javascript
var viceroyRest = require('viceroy-rest');
var viceroy = require('viceroy');
var util = require('util');

viceroy.driver(viceroyRest({
  host: 'localhost',
  port: 8000,
}));

function Tournament() {
  viceroy.Model.apply(this, arguments);

  this.schema({
    name: String,
  });
}

util.inherits(Tournament, viceroy.Model);
viceroy.model('tournament', Tournament);

viceroy.connect(function() {

  // POST http://localhost:8000/tournaments => {name: 'My Tournament'}
  Tournament.create({name: 'My Tournament'}, function(err, tournament) {});

  // GET http://localhost:8000/tournaments/123
  Tournament.findOne({_id: "123"}, function(err, tournament) {
    tournament.name = 'herp';
    // PUT http://localhost:8000/tournaments/123
    tournament.save(function(err, tournament){ })
  });

  // GET http://localhost:8000/tournaments
  Tournament.find({}, function(err, tournaments) { });

  // GET http://localhost:8000/tournaments?name=My%20Tournament
  Tournament.find({name: 'My Tournament'}, function(err, tournament) {});

  // DELETE http://localhost:8000/tournaments/123
  Tournament.remove({_id: "123"}, function(err, tournament) {});

});

```
