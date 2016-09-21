'use strict';

(function() {
  function Schema(rawData) {
    GroongaClient.Response.Base.call(this, rawData);
  }
  GroongaClient.Response.Schema = Schema;

  Schema.prototype = Object.create(GroongaClient.Response.Base.prototype);
  Schema.prototype.constructor = Schema;

  Schema.prototype.tables = function() {
    return this.body().tables;
  };
})();
