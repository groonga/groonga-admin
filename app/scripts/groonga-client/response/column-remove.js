'use strict';

(function() {
  function ColumnRemove(rawData) {
    GroongaClient.Response.Base.call(this, rawData);
  }
  GroongaClient.Response.ColumnRemove = ColumnRemove;

  ColumnRemove.prototype = Object.create(GroongaClient.Response.Base.prototype);
  ColumnRemove.prototype.constructor = ColumnRemove;

  ColumnRemove.prototype.isRemoved = function() {
    return this.isSuccess() && this.body();
  };
})();
