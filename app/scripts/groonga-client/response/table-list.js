'use strict';

(function() {
  function TableList(rawData) {
    GroongaClient.Response.Base.call(this, rawData);
  }
  GroongaClient.Response.TableList = TableList;

  TableList.prototype = Object.create(GroongaClient.Response.Base.prototype);
  TableList.prototype.constructor = TableList;

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
