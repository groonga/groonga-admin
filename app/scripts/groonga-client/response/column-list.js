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
    return this.body().slice(1).map(function(rawColumn) {
      return this.parseRawColumn(rawColumn);
    }, this);
  };

  ColumnList.prototype.parseRawColumn = function(rawColumn) {
    var parameters = this.parameters();
    var column = {
      properties: {},
      rawProperties: rawColumn
    };
    parameters.forEach(function(parameter, index) {
      var name = parameter.name;
      var value = rawColumn[index];
      switch (parameter.name) {
      case 'type':
        name = 'sizeType';
        break;
      case 'flags':
        value = value.split('|');
        break;
      case 'source':
        name = 'sources';
        break;
      }
      column[name] = column.properties[name] = value;
    });
    column.isScalar = column.flags.indexOf('COLUMN_SCALAR') != -1;
    column.isVector = column.flags.indexOf('COLUMN_VECTOR') != -1;
    column.isIndex  = column.flags.indexOf('COLUMN_INDEX')  != -1;
    if (column.isScalar) {
      column.type = 'scalar';
    } else if (column.isVector) {
      column.type = 'vector';
    } else if (column.isIndex) {
      column.type = 'index';
    } else {
      column.type = 'unknown';
    }
    return column;
  };
})();
