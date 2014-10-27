'use strict';

GroongaClient.Response = {
};

GroongaClient.Response.find = function(name) {
  var constructorName = name.replace(/(^.|_.)/g, function(matched) {
    if (matched.length === 1) {
      return matched.toUpperCase();
    } else {
      return matched[1].toUpperCase();
    }
  });
  return this[constructorName] || this.Base;
};
