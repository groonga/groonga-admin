'use strict';

(function() {
  function ThreadLimit(rawData) {
    GroongaClient.Response.Base.call(this, rawData);
  }
  GroongaClient.Response.ThreadLimit = ThreadLimit;

  ThreadLimit.prototype = Object.create(GroongaClient.Response.Base.prototype);
  ThreadLimit.prototype.constructor = ThreadLimit;

  ThreadLimit.prototype.lastMaxLimit = function() {
    return this.body();
  };
})();
