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
      var value = parameters[key].toString();
      if (value.length === 0) {
        continue;
      }
      params[key] = value;
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

  GroongaClient.Request.prototype.then = function(successCallback, errorCallback) {
    var name = this._name;
    return this._rawRequest.then(
      function(rawResponse) {
        var ResponseConstructor = GroongaClient.Response.find(name);
        var response = new ResponseConstructor(rawResponse.data);
        return successCallback(response, rawResponse);
      },
      function(rawResponse) {
        var ResponseConstructor = GroongaClient.Response.find(name);
        var response = new ResponseConstructor(rawResponse.data);
        return errorCallback(response, rawResponse);
      }
    );
  };

  GroongaClient.Request.prototype.success = function(callback) {
    var name = this._name;
    return this._rawRequest.then(function(rawResponse) {
      var ResponseConstructor = GroongaClient.Response.find(name);
      var response = new ResponseConstructor(rawResponse.data);
      return callback(response, rawResponse);
    });
  };

  GroongaClient.Request.prototype.error = function(callback) {
    var name = this._name;
    return this._rawRequest.then(null, function(rawResponse) {
      var ResponseConstructor = GroongaClient.Response.find(name);
      var response = new ResponseConstructor(rawResponse.data);
      return callback(response, rawResponse);
    });
  };

  GroongaClient.Request.prototype.commandLine = function() {
    function escapeCommandValue(value) {
      return value.toString().replace(/(["\\])/g, function(match) {
        return '\\' + match;
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
})();
