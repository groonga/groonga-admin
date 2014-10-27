'use strict';

(function() {
  function Select(rawData) {
    GroongaClient.Response.Base.call(this, rawData);
  }
  GroongaClient.Response.Select = Select;

  Select.prototype = Object.create(GroongaClient.Response.Base.prototype);
  Select.prototype.constructor = Select;

  Select.prototype.nTotalRecords = function() {
    return this.body()[0][0][0];
  };

  Select.prototype.columns = function() {
    return this.body()[0][1].map(function(rawDefinition) {
      return {
        name: rawDefinition[0],
        type: rawDefinition[1]
      };
    });
  };

  Select.prototype.records = function() {
    return this.body()[0].slice(2);
  };
})();
