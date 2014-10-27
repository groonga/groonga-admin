'use strict';

(function() {
  function GroongaClient($http) {
    this._$http = $http;
    this._pathPrefix = '/d/';
  }
  window.GroongaClient = GroongaClient;

  GroongaClient.prototype.execute = function(name, parameters) {
    var params = {
      callback: 'JSON_CALLBACK'
    };
    for (var key in parameters) {
      params[key] = parameters[key];
    }
    var rawRequest = this._$http.jsonp(this._pathPrefix + name + '.json',
                                       {params: params});
    var request = new GroongaClient.Request(rawRequest, name, params);
    return request;
  };

  GroongaClient.Request = function(rawRequest, name, parameters) {
    this._rawRequest = rawRequest;
    this._name = name;
    this._parameters = parameters;
  };

  GroongaClient.Request.prototype.success = function(callback) {
    var name = this._name;
    this._rawRequest.success(function(data, status, headers, config) {
      var ResponseConstructor = GroongaClient.Response.find(name);
      var response = new ResponseConstructor(data);
      callback(response, status, headers, config);
    });
    return this;
  };

  GroongaClient.Request.prototype.error = function(callback) {
    this._rawRequest.error(callback);
    return this;
  };

  GroongaClient.Request.prototype.commandLine = function() {
    function escapeCommandValue(value) {
      return value.replace(/(["\\])/g, function(match) {
        return '\\' + match[1];
      });
    }

    var components = [this._name];
    for (var key in this._parameters) {
      if (key === 'callback') {
        continue;
      }

      var value = this._parameters[key];
      components.push('--' + key);
      components.push('"' + escapeCommandValue(value) + '"');
    }
    return components.join(' ');
  };

  GroongaClient.Response = GroongaResponse;
})();
