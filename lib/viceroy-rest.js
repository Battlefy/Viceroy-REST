var superagent = require('superagent');
var formatQuery = require('qs').stringify;
var tools = require('primitive');

/**
 * Viceroy REST constructor
 * @param {Object} opts Viceroy REST opts.
 */
function ViceroyRest(opts) {

  // defaults
  opts = opts || {};

  // validate
  if(typeof opts != 'object') {
    throw new Error('opts must be an object');
  }

  // setup
  this._requests = null;
  this.opts = opts;
}

/**
 * Setup Viceroy REST
 * @param  {Function} [cb] Executed upon completion.
 */
ViceroyRest.prototype.connect = function(cb) {

  // defaults
  cb = cb || function() {};

  // validate
  if(typeof cb != 'function') { throw new Error('cb must be a function'); }

  // Attach withCredentials for node.
  superagent.Request.prototype.withCredentials = function() {
    this._withCredentials = this.opts.withCredentials;
    return this;
  };

  // setup the base url.
  this._baseUrl = 'http://' + this.opts.host;
  if(this.opts.port) { this._baseUrl += ':' + this.opts.port; }

  // callback
  cb();
};

/**
 * Index
 * @param  {Object}   indexes Array of field paths.
 * @param  {Object}   opts    Indexing opts.
 * @param  {Function} cb      Executed upon completion.
 */
ViceroyRest.prototype.index = function(indexes, opts, cb) {
  // NOTE: Indexing is completely unsupported in
  // Viceroy REST. It doesn't make any sense for
  // the client to be indexing anything.

  // validate
  if(typeof cb != 'function') { throw new Error('cb must be an object'); }
  if(indexes === null || typeof indexes != 'object' || typeof indexes.length != 'number') {
    return cb(new Error('indexes must be an array'));
  }
  if(opts === null || typeof opts != 'object') { return cb(new Error('opts must be an object')); }

  // if any indexes are passed then throw.
  if(indexes.length > 0) {
    cb(new Error('Indexing not supported by Viceroy REST. This should be done server side'));
  } else { cb(); }
};

/**
 * Find
 * @param  {Object}   query Viceroy query object.
 * @param  {Object}   opts  Viceroy query opts.
 * @param  {Function} cb    Executed upon completion.
 */
ViceroyRest.prototype.find = function(query, opts, cb) {

  // validate
  if(typeof cb != 'function') { throw new Error('cb must be an object'); }
  if(query === null || typeof query != 'object') { return cb(new Error('query must be an object')); }
  if(opts === null || typeof opts != 'object') { return cb(new Error('opts must be an object')); }

  // start the scheduler
  this._startScheduler();

  // get the request url
  var url = this._getUrl(opts);
  query = tools.merge({}, query, true);

  // batch the requests by query (minus the id)
  // and url
  if(query._id) {

    // extract the id(s) from the query.
    var queryIds = query._id;
    if(
      typeof queryIds == 'object' ||
      typeof queryIds.length != 'number'
    ) { queryIds = [queryIds]; }
    delete query._id;

    // create a batch key
    var key = this._genBatchKey(['getIds', url, query]);

    // get the request object.
    var request = this._requests[key];
    query._id = { $in: [] };
    if(!request) {
      request = this._requests[key] = {
        method: 'get',
        url: url,
        query: query,
        targets: []
      };
    }

    // add the ids to the request object.
    for(var i = 0; i < queryIds.length; i += 1) {
      request.query._id.$in.push(queryIds[i]);
    }

    // add a target for the current request
    request.targets.push(function(err, records) {
      if(err) { return cb(err); }

      // loop through the data and pull out the
      // correct records.
      var targetRecords = [];
      for(var i = 0; i < records.length; i += 1) {

        // if the current record has the correct
        // id then add it to the target records.
        if(queryIds.indexOf(records[i]._id) > -1) {
          targetRecords.push(records[i]);
        }

        // If the results is fewer than 1 then
        // make up an error instead of giving
        // back an empty set.
        // NOTE: I hate this. It needs to go away.
        // - Rob.
        if(targetRecords.length < 1) { return cb(new Error('Not Found (404)')); } 

        // callback with the results
        cb(undefined, targetRecords);
      }
    });
  }

  // ordinary request batching.
  else {

    // create a batch key
    var key = this._genBatchKey(['get', url, query]);

    // get the request object.
    var request = this._requests[key];
    if(!request) {
      request = this._requests[key] = {
        method: 'get',
        url: url,
        query: query,
        targets: []
      };
    }

    // add a target for the current request
    request.targets.push(function(err, records) {
      if(err) { return cb(err); }

      // If the results is fewer than 1 then
      // make up an error instead of giving
      // back an empty set.
      // NOTE: I hate this. It needs to go away.
      // - Rob.
      if(records.length < 1) { return cb(new Error('Not Found (404)')); } 

      // callback with the results
      cb(undefined, records);
    });
  }
};

/**
 * Insert
 * @param  {Object}   records Array of records.
 * @param  {Object}   opts    Insert opts.
 * @param  {Function} cb      Executed upon completion.
 */
ViceroyRest.prototype.insert = function(records, opts, cb) {

  // defaults
  cb = cb || function() {};

  // validate
  if(typeof cb != 'function') { throw new Error('cb must be an object'); }
  if(query === null || typeof query != 'object') { return cb(new Error('query must be an object')); }
  if(opts === null || typeof opts != 'object') { return cb(new Error('opts must be an object')); }

  // start the scheduler
  this._startScheduler();

  // get the request url
  var url = this._getUrl(opts);

  // create a batch key
  var key = this._genBatchKey(['post', url]);

  // get the request object.
  var request = this._requests[key];
  if(!request) {
    request = this._requests[key] = {
      method: 'post',
      url: url,
      records: [],
      targets: []
    };
  }

  // add the payload to the request
  var offset = request.records.length;
  var limit = records.length;

  // grab the results for the target
  request.targets.push(function(err, records) {
    if(err) { return cb(err); }
    cb(undefined, records.slice(offset, limit));
  });
};

/**
 * Generate a url for a given query.
 * @private
 * @param  {Object} opts  Viceroy query opts.
 * @return {String}       Request url.
 */
ViceroyRest.prototype._getUrl = function(opts) {

  // if this is a sub route then figure out the
  // sub resource url.
  var url = '';
  if(opts.context && opts.context.opts.nested) {
    var nestedPath = opts.context.opts.getterPath;
    if(typeof opts.context.opts.nested === 'string') {
      nestedPath = opts.context.opts.nested;
    }
    url = this._baseUrl + '/' + opts.context.collection +
          '/' + opts.context.parentId + '/' + nestedPath;
  }

  // if this is a root route then simply assemble
  // the url.
  else { url = this._baseUrl + '/' + opts.collection; }

  // return the url.
  return url;
};

/**
 * Schedules and sends all pending requests.
 * @private
 */
ViceroyRest.prototype._startScheduler = function() {

  // if the requests object already exists the
  // scheduler is already started so return.
  if(this._requests) { return; }
  this._requests = {};

  // on next tick send the requests out.
  process.nextTick(function() {

    // process each request
    for(var key in this._requests) {
      if(this._requests.hasOwnProperty(key)) {
        (function(request) {

          // create a function for executing each
          // of the request targets.
          var cb = function(err, records) {
            for(var i = 0; i < request.targets.length; i += 1) {
              request.targets[i](err, records);
            }
          };

          // use superagent to make the request.
          var r = superagent[request.method](request.url);
          if(request.query) { r.query(formatQuery(request.query)); }
          if(request.body) { r.send(request.body); }
          r.withCredentials();
          r.end(function(err, res) {
            if(err) { return cb(err); }
            if(!res || !res.body) { return cb(undefined, []); }
            if(typeof res.body != 'object' || typeof res.body.length != 'number') {
              return cb(undefined, new Error('server response from ' + request.url + ' does not contain the expected JSON array of records'));
            }
            cb(undefined, res.body);
          });
        })(this._requests[key]);
      }
    }

    // null out the requests object.
    this._requests = null;
  });
};

/**
 * Create a request batch key from a collection of specimens.
 * @private
 * @param  {Object} specimens Array of Specimens.
 * @return {String}           Batch key.
 */
ViceroyRest.prototype._genBatchKey = function(specimens) {

  // validate
  if(!specimens) { throw new Error('specimens is a required argument'); }

  // ensure specimens are always wrapped in an
  // array.
  if(
    specimens === null ||
    typeof specimens != 'object' ||
    typeof specimens.length != 'number'
  ) {
    specimens = [specimens];
  }

  // process each specimen.
  var key = [];
  for(var i = 0; i < specimens.length; i += 1) {

    // get the specimen type.
    var type = typeof specimens[i];

    // if the type is and object then convert it
    // to a string.
    if(type == 'object') {
      specimens[i] = this._genObjKey(specimens[i]);
    }

    // add the specimen to key.
    key.push(specimens[i]);
  }
  return key.join('|');
};

/**
 * Create a key from an object. An object will always produce the same key
 * regardless of property order.
 * @private
 * @param  {Object} specimen Specimen object.
 * @return {String}          Object key.
 */
ViceroyRest.prototype._genObjKey = function(specimen) {

  // validate
  if(specimen === null || typeof specimen != 'object') { throw new Error('specimen must be an object'); }

  // generate key
  return (function rec(node) {
    var key = [];
    for(var prop in node) {
      if(node.hasOwnProperty(prop)) {
        if(node[prop] !== null && typeof node[prop] == 'object') {
          key.push(prop + ':(' + rec(node[prop]) + ')');
        } else {
          key.push(prop + ':' + (typeof node[prop]).charAt(0) + ':' + node[prop]);
        }
      }
    }
    return key.sort(function(a, b) {
      if(a === b) { return 0; }
      return a > b;
    }).join(':');
  })(obj);
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

ViceroyRest.prototype.update = function(query, delta, opts, cb) {
  var sendData = this._beforeSend(delta);
  superagent
    .put(this._getUrl(opts) + '/' + query._id)
    .withCredentials()
    .send(sendData)
    .end(function(err, res){ 
      if(err) { return err; }
      if(!res || !res.body) { return cb(); }
      cb(err, res.body);
    });
};

ViceroyRest.prototype.remove = function(query, opts, cb) {
  superagent
    .del(this._getUrl(opts))
    .withCredentials()
    .query(formatQuery(query))
    .end(function(err, res){ 
      if(err) { return err; }
      if(!res || !res.body) { return cb(); }
      cb(err, res.body);
    });
};

ViceroyRest.prototype.removeOne = function(query, opts, cb) {
  var url = this._getUrl(opts);
  if(query._id) {
    superagent
      .del(url + '/' + query._id)
      .withCredentials()
      .end(function(err, res) {
        if(err) { return err; }
        if(!res || !res.body || !res.body[0]) { return cb(); }
        cb(err, res.body[0]);
      });
  } else {
    query.$limit = 1;
    superagent
      .del(url + opts.collection)
      .withCredentials()
      .query(formatQuery(query))
      .end(function(err, res) {
        if(err) { return cb(err); }
        if(!res || !res.body) { return cb(); }
        cb(err, res.body[0]);
      });
  }
};

module.exports = exports =function(config){
  return new ViceroyRest(config)
}

exports.ViceroyRest = ViceroyRest;
