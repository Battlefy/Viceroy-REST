var viceroyRest = require('../');
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
