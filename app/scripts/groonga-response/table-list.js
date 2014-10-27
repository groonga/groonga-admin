'use strict';

(function() {
  function TableList(rawData) {
    this._rawData = rawData;
  }
  GroongaResponse.TableList = TableList;

  TableList.prototype.header = function() {
    return this._rawData[0];
  };

  TableList.prototype.status = function() {
    return this.header()[0];
  };

  TableList.prototype.isSuccess = function() {
    return this.status() === 0;
  };

  TableList.prototype.startTime = function() {
    var startTime = new Date();
    startTime.setTime(this.header()[1]);
    return startTime;
  };

  TableList.prototype.elapsedTime = function() {
    return this.header()[2];
  };

  TableList.prototype.errorMessage = function() {
    return this.header()[3];
  };

  TableList.prototype.body = function() {
    return this._rawData[1];
  };

  TableList.prototype.parameters = function() {
    return this.body()[0].map(function(parameter) {
      return {
        name: parameter[0],
        type: parameter[1]
      };
    });
  };

  TableList.prototype.tables = function() {
    var parameters = this.parameters();
    console.log(this.body());
    console.log(this.body()[1]);
    console.log(this.body().slice(1));
    return this.body().slice(1).map(function(tableProperties) {
      var table = {};
      parameters.forEach(function(parameter, index) {
        table[parameter.name] = tableProperties[index];
      });
      return table;
    });
  };
})();
