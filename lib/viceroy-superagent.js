var tools = require('primitive');
var request = require('superagent');


var filterBody = function(res) {
  var body;
  if(res && res.body){
    body = res.body;
  }
  return body;
}

function ViceroySuperAgent(opts) {
  opts = opts || {};

  if(typeof opts != 'object') {
    throw new Error('opts must be an object');
  }

  this.opts = opts;
}

ViceroySuperAgent.prototype._validateConfig = function(callback){
  if (this.opts.host === undefined){
    return callback(new Error('invalid host specified'))
  }
  callback();
}

ViceroySuperAgent.prototype._setBaseUrl = function(){
  this._baseUrl = this._getBaseUrl();
}

ViceroySuperAgent.prototype._getBaseUrl = function(){
  var port;
  if(this.opts.port){
    port = ':' + this.opts.port;
  } else {
    port = '';
  }
  return 'http://' + this.opts.host + port;
}

ViceroySuperAgent.prototype.connect = function(callback) {
  var _this = this;
  this._validateConfig(function(err){
    if(err) { return callback(err); }
    _this._setBaseUrl();
    callback();
  });
};

ViceroySuperAgent.prototype.find = function(query, opts, callback) {
  request
    .get(this._baseUrl + '/' + opts.collection)
    .query(query)
    .end(function(err, res){ callback(err, filterBody(res)); })
};

ViceroySuperAgent.prototype.findOne = function(query, opts, callback) {
  request
    .get(this._baseUrl + '/' + opts.collection + '/' + query._id)
    .query(query)
    .end(function(err, res){ callback(err, filterBody(res)); })
};

ViceroySuperAgent.prototype.insert = function(data, opts, callback) {
  request
    .post(this._baseUrl + '/' + opts.collection)
    .send(data[0])
    .end(function(err, res){
      var body;
      if(res && res.body){
        body = res.body;
        body = [body];
      }
      callback(err, body);
    });
};

ViceroySuperAgent.prototype.update = function(query, delta, opts, callback) {
  request
    .put(this._baseUrl + '/' + opts.collection + '/' + query._id)
    .send(delta)
    .end(function(err, res){ callback(err, filterBody(res)); })
};

ViceroySuperAgent.prototype.remove = function(query, opts, callback) {
  request
    .del(this._baseUrl + '/' + opts.collection)
    .end(function(err, res){ callback(err, filterBody(res)); })
};

ViceroySuperAgent.prototype.removeOne = function(query, opts, callback) {
  request
    .del(this._baseUrl + '/' + opts.collection + '/' + query._id)
    .end(function(err, res){ callback(err, filterBody(res)); })
};

ViceroySuperAgent.prototype.index = function(){};


module.exports = function(config){
  return new ViceroySuperAgent(config)
}
