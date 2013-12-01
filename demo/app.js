var viceroySuperAgent = require('../');
var viceroy = require('viceroy');
var util = require('util');

viceroy.driver(viceroySuperAgent({
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
  var query = {_id: "52998de7effdc000000557a5"};

  // GET http://localhost:8000/tournaments/52998de7effdc000000557a5
  Tournament.findOne(query, function(err, tournament) {
    tournament.name = 'herp';
    // PUT http://localhost:8000/tournaments/52998de7effdc000000557a5
    tournament.save(function(err, tournament){ })
  });

  // GET http://localhost:8000/tournaments
  Tournament.find({}, function(err, tournaments) { });

  // POST http://localhost:8000/tournaments => {name: 'My Tournament'}
  Tournament.create({name: 'My Tournament'}, function(err, tournament) { });

  // GET http://localhost:8000/tournaments?name=My%20Tournament
  Tournament.find({name: 'My Tournament'}, function(err, tournament) { });
});
