var tools = require('primitive');
var request = require('superagent');

// TODO: add query params for queries

function Middleware(config) {
  this._config = config;
}

Middleware.prototype.connect = function(callback) {
  callback();
};

Middleware.prototype.save = function(modelName, data, callback) {
  request
    .post('/' + modelName)
    .send(data)
    .end(callback)
};

Middleware.prototype.remove = function(modelName, query, opts, callback) {
  opts = opts || {};
  if(typeof opts == 'function') {
    callback = opts;
    opts = {};
  }
  request
    .remove('/' + modelName + '/' + query._id)
    .end(callback)
};

Middleware.prototype.find = function(modelName, query, opts, callback) {
  if(typeof opts == 'function') {
    callback = opts;
    opts = {};
  }
  opts = opts || {};
  request
    .get('/' + modelName)
    .end(callback)
};

Middleware.prototype.findOne = function(modelName, query, opts, callback) {
  if(typeof opts == 'function') {
    callback = opts;
    opts = {};
  }

  opts = opts || {};
  request
    .get('/' + modelName + '/' + query._id)
    .end(callback)
};

module.exports = function(config) {
  return new Middleware(config);
};
