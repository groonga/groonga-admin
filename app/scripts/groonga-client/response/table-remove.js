'use strict';

(function() {
  function TableRemove(rawData) {
    GroongaClient.Response.Base.call(this, rawData);
  }
  GroongaClient.Response.TableRemove = TableRemove;

  TableRemove.prototype = Object.create(GroongaClient.Response.Base.prototype);
  TableRemove.prototype.constructor = TableRemove;

  TableRemove.prototype.isRemoved = function() {
    return this.isSuccess() && this.body();
  };
})();
