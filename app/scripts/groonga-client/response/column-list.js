'use strict';

(function() {
  function ColumnList(rawData) {
    GroongaClient.Response.Base.call(this, rawData);
  }
  GroongaClient.Response.ColumnList = ColumnList;

  ColumnList.prototype = Object.create(GroongaClient.Response.Base.prototype);
  ColumnList.prototype.constructor = ColumnList;

  ColumnList.prototype.parameters = function() {
    return this.body()[0].map(function(parameter) {
      return {
        name: parameter[0],
        type: parameter[1]
      };
    });
  };

  ColumnList.prototype.columns = function() {
    var parameters = this.parameters();
    return this.body().slice(1).map(function(columnProperties) {
      var column = {};
      parameters.forEach(function(parameter, index) {
        var name = parameter.name;
        var value = columnProperties[index];
        switch (parameter.name) {
        case 'flags':
          value = value.split('|');
          break;
        case 'source':
          name = 'sources';
          break;
        }
        column[name] = value;
      });
      column.isScalar = column.flags.indexOf('COLUMN_SCALAR') != -1;
      column.isVector = column.flags.indexOf('COLUMN_VECTOR') != -1;
      column.isIndex  = column.flags.indexOf('COLUMN_INDEX')  != -1;
      return column;
    });
  };
})();
