var request = require('superagent');
var formatQuery = require('qs').stringify;

var filterBody = function(res) {
  var body;
  if(res && res.body){
    body = res.body;
  }
  return body;
}

function ViceroyRest(opts) {
  opts = opts || {};

  if(typeof opts != 'object') {
    throw new Error('opts must be an object');
  }

  this.opts = opts;
}

ViceroyRest.prototype._validateConfig = function(callback){
  var opts = this.opts
  request.Request.prototype.withCredentials = function(){
    this._withCredentials = opts.withCredentials;
    return this;
  }

  if (this.opts.host === undefined){
    return callback(new Error('invalid host specified'))
  }
  callback();
}

ViceroyRest.prototype._setBaseUrl = function(){
  this._baseUrl = this._getBaseUrl();
}

ViceroyRest.prototype._getBaseUrl = function(){
  var port;
  if(this.opts.port){
    port = ':' + this.opts.port;
  } else {
    port = '';
  }
  return 'http://' + this.opts.host + port;
}

ViceroyRest.prototype.connect = function(callback) {
  var _this = this;
  this._validateConfig(function(err){
    if(err) { return callback(err); }
    _this._setBaseUrl();
    callback();
  });
};

ViceroyRest.prototype.find = function(query, opts, callback) {
  var url = this._baseUrl + '/' + opts.collection;
  if(opts.context && opts.context.opts.nested){
    var nestedPath = opts.context.opts.getterPath
    if(typeof opts.context.opts.nested === 'string') {
      nestedPath = opts.context.opts.nested;
    }
    url += '/' + opts.context.parentId + '/' + nestedPath;
  }
  request
    .get(url)
    .withCredentials()
    .query(formatQuery(query))
    .end(function(err, res){ callback(err, filterBody(res)); })
};

ViceroyRest.prototype.findOne = function(query, opts, callback) {
  if(opts.context && opts.context.opts.nested){
    var nestedPath = opts.context.opts.getterPath
    if(typeof opts.context.opts.nested === 'string') {
      nestedPath = opts.context.opts.nested;
    }
    queryId = query._id;
    delete query._id;
    var url = this._baseUrl + '/' + opts.collection;
    url += '/' + opts.context.parentId + '/' + nestedPath + '/' + queryId;
    request
      .get(url)
      .withCredentials()
      .query(formatQuery(query))
      .end(function(err, res) {
        callback(err, filterBody(res));
      });
    return 
  }

  if(query._id) {
    queryId = query._id;
    delete query._id;
    request
      .get(this._baseUrl + '/' + opts.collection + '/' + queryId)
      .withCredentials()
      .query(formatQuery(query))
      .end(function(err, res) {
        callback(err, filterBody(res));
      });
  } else {
    // query.$limit = 1;
    request
      .get(this._baseUrl + '/' + opts.collection)
      .withCredentials()
      .query(formatQuery(query))
      .end(function(err, res) {
        callback(err, filterBody(res)[0]);
      });
  }
};

ViceroyRest.prototype.insert = function(data, opts, callback) {

  // handle arrays
  if(data.constructor == Array) {
    var dataSet = data;
    data = [];
    var j = dataSet.length;
    for(var i = 0; i < dataSet.length; i += 1) {
      this.insert(dataSet[i], opts, function(err, modelData) {
        if(err) { j = 0; callback(err); return; }
        data.push(modelData);
        j -= 1;
        if(j == 0) { callback(undefined, data); }
      });
    }
    return;
  }

  // send the data
  request
    .post(this._baseUrl + '/' + opts.collection)
    .withCredentials()
    .send(data)
    .end(function(err, res) {
      callback(err, filterBody(res));
    });
};

ViceroyRest.prototype.update = function(query, delta, opts, callback) {
  request
    .put(this._baseUrl + '/' + opts.collection + '/' + query._id)
    .withCredentials()
    .send(delta)
    .end(function(err, res){ callback(err, filterBody(res)); })
};

ViceroyRest.prototype.remove = function(query, opts, callback) {
  request
    .del(this._baseUrl + '/' + opts.collection)
    .withCredentials()
    .end(function(err, res){ callback(err, filterBody(res)); })
};

ViceroyRest.prototype.removeOne = function(query, opts, callback) {
  if(query._id) {
    request
      .del(this._baseUrl + '/' + opts.collection + '/' + query._id)
      .withCredentials()
      .end(function(err, res) {
        callback(err, filterBody(res));
      });
  } else {
    // query.$limit = 1;
    request
      .del(this._baseUrl + '/' + opts.collection)
      .withCredentials()
      .query(formatQuery(query))
      .end(function(err, res) {
        callback(err, filterBody(res)[0]);
      });
  }
};

ViceroyRest.prototype.index = function(indexes, opts, callback) {
  if(indexes.length > 0) {
    callback(new Error('Indexing not supported by Viceroy REST. This should be done server side'));
  } else {
    callback();
  }
};

module.exports = exports =function(config){
  return new ViceroyRest(config)
}

exports.ViceroyRest = ViceroyRest;
