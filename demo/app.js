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

  Team.find(query, function(err, team) {});
  Team.findOne(query, function(err, team) {});
  Team.count(query, function(err, count) {});

  var team = new Team({
    name: 'THETEAM',
  });

  team.save(function(err) {});
  team.remove(function(err) {});
});
