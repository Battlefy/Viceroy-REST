
# Viceroy SuperAgent Driver

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
This is a driver for making http requests to a rest server, preferably
one powered by viceroy. This works in both node and in the browser.
Check out the package.json for browserify build examples.

## Docs

please stand by...

## Example

```javascript

var viceroySuperAgent = require('../');
var viceroy = require('viceroy');
var util = require('util');

viceroy.driver(viceroySuperAgent({
  host: 'localhost',
  port: 8000,
}));

function Team(data) {
  viceroy.Model.call(this, data);

  this.schema({
    name: String,
    age: Number,
    tags: Array
  });
}

util.inherits(Team, viceroy.Model);
viceroy.model('team', Team);

viceroy.connect(function() {
  var query = {_id: 1};

  Team.find(query, function(err, people) {});
  Team.findOne(query, function(err, team) {});
  Team.count(query, function(err, count) {});

  var team = new Team({
    name: 'THETEAM',
  });

  team.save(function(err) {});
  team.remove(function(err) {});
});

```
