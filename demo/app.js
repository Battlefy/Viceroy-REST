var viceroySuperAgent = require('../');
var viceroy = require('viceroy');
var util = require('util');

viceroy.driver(viceroySuperAgent({
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
  Tournament.findOne(query, function(err, tournament) {
    console.log('tournament=', tournament);
  });
});
