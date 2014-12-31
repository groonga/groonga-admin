'use strict';

(function() {
  function TableCreate(rawData) {
    GroongaClient.Response.Base.call(this, rawData);
  }
  GroongaClient.Response.TableCreate = TableCreate;

  TableCreate.prototype = Object.create(GroongaClient.Response.Base.prototype);
  TableCreate.prototype.constructor = TableCreate;

  TableCreate.prototype.isCreated = function() {
    return this.isSuccess() && this.body();
  };
})();
