'use strict';

(function() {
  function Base(rawData) {
    this._rawData = rawData;
  }
  GroongaClient.Response.Base = Base;

  Base.prototype.rawData = function() {
    return this._rawData;
  };

  Base.prototype.header = function() {
    return this._rawData[0];
  };

  Base.prototype.status = function() {
    return this.header()[0];
  };

  Base.prototype.isSuccess = function() {
    return this.status() === 0;
  };

  Base.prototype.startTime = function() {
    var startTime = new Date();
    startTime.setTime(this.header()[1]);
    return startTime;
  };

  Base.prototype.elapsedTime = function() {
    return this.header()[2];
  };

  Base.prototype.errorMessage = function() {
    return this.header()[3];
  };

  Base.prototype.body = function() {
    return this._rawData[1];
  };
})();
