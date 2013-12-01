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

## Docs

please stand by...

## Example

```javascript

var viceroyRest = require('viceroy-superagent');
var viceroy = require('viceroy');
var util = require('util');

viceroy.driver(viceroyRest({
  host: 'localhost',
  port: 8000,
}));

function Tournament(data) {
  viceroy.Model.call(this, data);

  this.schema({
    name: String,
  });
}

util.inherits(Tournament, viceroy.Model);
viceroy.model('tournament', Tournament);

viceroy.connect(function() {
  var query = {_id: "52998de7effdc000000557a5"};

  // does a GET for http://localhost:8000/tournaments/52998de7effdc000000557a5
  Tournament.findOne(query, function(err, tournament) {
    console.log('tournament=', tournament);
  });

});

```
