var superagent = require('superagent');
var formatQuery = require('qs').stringify;
var tools = require('primitive');

function handleError(err, res, callback) {
  if(err) { return callback(err); }
  if(res.error) {
    if(res.body && res.body.error){
      return callback(res.body.error);
    } else {
      return callback(res.error);
    }
  }
}


function ViceroyRest(opts) {
  opts = opts || {};

  if(typeof opts != 'object') {
    throw new Error('opts must be an object');
  }
  this._scheduledRequests = null;
  this.opts = opts;
}

ViceroyRest.prototype._validateConfig = function(callback){
  var opts = this.opts;

  superagent.Request.prototype.withCredentials = function(){
    this._withCredentials = opts.withCredentials;
    return this;
  };

  if (this.opts.host === undefined){
    return callback(new Error('invalid host specified'))
  }

  if (this.opts.beforeSend !== undefined && typeof this.opts.beforeSend !== 'function'){
    return callback(new Error('beforeSend must be a function'))
  }
  callback();
};

ViceroyRest.prototype._getUrl = function(query, opts){
  var url = this._baseUrl + '/' + opts.collection;

  if(opts.context && opts.context.opts.nested){
    var nestedPath = opts.context.opts.getterPath;
    if(typeof opts.context.opts.nested === 'string') {
      nestedPath = opts.context.opts.nested;
    }
    var url = this._baseUrl + '/' + opts.context.collection;
    url += '/' + opts.context.parentId + '/' + nestedPath;
  }

  return url;
};

ViceroyRest.prototype._setBaseUrl = function(){
  this._baseUrl = this._getBaseUrl();
};

ViceroyRest.prototype._getBaseUrl = function(){
  var port;
  if(this.opts.port){
    port = ':' + this.opts.port;
  } else {
    port = '';
  }
  return 'http://' + this.opts.host + port;
};

ViceroyRest.prototype._createRequestKey = function(method, url, query) {
  var _query = tools.merge({}, query, true);
  if(_query._id) { delete _query._id; }
  return method + '|' + url + '|' + JSON.stringify(_query);
};

ViceroyRest.prototype._request = function(method, url, query, callback) {

  // id based requests
  if(query._id) {

    // strip the ids from the query
    var ids;
    if(query._id.$in) { ids = query._id.$in; }
    else { ids = [query._id]; }
    delete query._id;

    // schedule a request
    this._scheduleRequests();

    // check for a pending request
    var requestKey = this._createRequestKey(method, url, query);
    var request = this._scheduledRequests[requestKey];

    // create the request if it doesn't exist already
    if(!request) {
      request = this._scheduledRequests[requestKey] = {
        method: method,
        url: url,
        ids: ids.slice(0),
        query: query,
        subRequests: [{
          ids: ids.slice(0),
          callback: callback
        }]
      };
    } else {

      // add the ids to the request
      for(var i = 0; i < ids.length; i += 1) {
        if(request.ids.indexOf(ids[i]) === -1) {
          request.ids.push(ids[i]);
        }
      }

      // add the sub request so we can sort out were
      // the data goes once it comes back.
      request.subRequests.push({
        ids: ids.slice(0),
        callback: callback
      });
    }
  }

  // any other requests
  else {
    superagent[method](url)
      .withCredentials()
      .query(formatQuery(query))
      .end(function(err, res){
        if(err || res.error) return handleError(err, res, callback);
        if(!res || !res.body) { return callback(); }
        callback(undefined, res.body);
      });
  }
};

ViceroyRest.prototype._scheduleRequests = function() {
  var _this = this;

  // create a function for executing the callbacks
  var done = function(subRequests, err, results) {
    for(var i = 0; i < subRequests.length; i += 1) {
      var subRequest = subRequests[i];
      if(err) { subRequest.callback(err); }
      else if(!results) { subRequest.callback(err, []); }
      else {
        var ids = subRequest.ids;
        var resultSet = [];
        for(var j = 0; j < results.length; j += 1) {
          for(var k = 0; k < ids.length; k += 1) {
            if(ids[k] == results[j]._id) {
              resultSet.push(results[j]);
            }
          }
        }
        if(resultSet.length < 1) { 
          subRequest.callback(new Error('Not Found (404)'));
        } else {
          subRequest.callback(undefined, resultSet);
        }
      }
    }
  };

  // exit if requests have already been queued
  if(this._scheduledRequests) { return; }

  // create the scheduledRequests object
  this._scheduledRequests = {};

  // setup for the next tick
  process.nextTick(function() {
    var scheduledRequests = _this._scheduledRequests;
    _this._scheduledRequests = null;
    for(var key in scheduledRequests) {
      (function(request) {
        request.query._id = { $in: request.ids };
        superagent[request.method](request.url)
          .withCredentials()
          .query(formatQuery(request.query))
          .end(function(err, res){
            if(err) { return done(request.subRequests, err); }
            if(!res || !res.body) { return done(request.subRequests); }
            done(request.subRequests, undefined, res.body);
          });
      })(scheduledRequests[key]);
    }
  });
};

ViceroyRest.prototype.connect = function(callback) {
  var _this = this;
  this._validateConfig(function(err){
    if(err) { return callback(err); }
    _this._setBaseUrl();
    callback();
  });
};

ViceroyRest.prototype.find = function(query, opts, callback) {
  this._request('get', this._getUrl(query, opts), query, callback);
};

ViceroyRest.prototype._beforeSend = function(data) {
  if(this.opts.beforeSend){
    var returnData = this.opts.beforeSend(data);
    if(returnData !== undefined){
      data = returnData;
    }
  }
  return data;
}

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

  var url = this._getUrl({}, opts);
  var sendData = this._beforeSend(data);

  // send the data
  superagent
    .post(url)
    .withCredentials()
    .send(sendData)
    .end(function(err, res) {
      if(err || res.error) return handleError(err, res, callback);
      if(!res || !res.body) { return callback(); }
      callback(err, res.body);
    });
};

ViceroyRest.prototype.update = function(query, delta, opts, callback) {
  var sendData = this._beforeSend(delta);
  superagent
    .put(this._getUrl(query, opts) + '/' + query._id)
    .withCredentials()
    .send(sendData)
    .end(function(err, res){
      if(err || res.error) return handleError(err, res, callback);
      if(!res || !res.body) { return callback(); }
      callback(err, res.body);
    });
};

ViceroyRest.prototype.remove = function(query, opts, callback) {
  superagent
    .del(this._getUrl(query, opts))
    .withCredentials()
    .query(formatQuery(query))
    .end(function(err, res){
      if(err || res.error) return handleError(err, res, callback);
      if(!res || !res.body) { return callback(); }
      callback(err, res.body);
    });
};

ViceroyRest.prototype.removeOne = function(query, opts, callback) {
  var url = this._getUrl(query, opts);
  if(query._id) {
    superagent
      .del(url + '/' + query._id)
      .withCredentials()
      .end(function(err, res) {
        if(err || res.error) return handleError(err, res, callback);
        if(!res || !res.body || !res.body[0]) { return callback(); }
        callback(err, res.body[0]);
      });
  } else {
    query.$limit = 1;
    superagent
      .del(url + opts.collection)
      .withCredentials()
      .query(formatQuery(query))
      .end(function(err, res) {
        if(err || res.error) return handleError(err, res, callback);
        if(!res || !res.body) { return callback(); }
        callback(err, res.body[0]);
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
