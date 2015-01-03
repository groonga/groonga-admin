'use strict';

(function() {
  function ColumnCreate(rawData) {
    GroongaClient.Response.Base.call(this, rawData);
  }
  GroongaClient.Response.ColumnCreate = ColumnCreate;

  ColumnCreate.prototype = Object.create(GroongaClient.Response.Base.prototype);
  ColumnCreate.prototype.constructor = ColumnCreate;

  ColumnCreate.prototype.isCreated = function() {
    return this.isSuccess() && this.body();
  };
})();
