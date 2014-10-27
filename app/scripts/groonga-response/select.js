'use strict';

(function() {
  function Select(rawData) {
    this._rawData = rawData;
  }
  GroongaResponse.Select = Select;

  Select.prototype.rawData = function() {
    return this._rawData;
  };

  Select.prototype.header = function() {
    return this._rawData[0];
  };

  Select.prototype.status = function() {
    return this.header()[0];
  };

  Select.prototype.isSuccess = function() {
    return this.status() === 0;
  };

  Select.prototype.startTime = function() {
    var startTime = new Date();
    startTime.setTime(this.header()[1]);
    return startTime;
  };

  Select.prototype.elapsedTime = function() {
    return this.header()[2];
  };

  Select.prototype.errorMessage = function() {
    return this.header()[3];
  };

  Select.prototype.body = function() {
    return this._rawData[1];
  };

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
