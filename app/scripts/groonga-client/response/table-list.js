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
    return this.body().slice(1).map(function(tableProperties) {
      var table = {
        properties: {},
        rawProperties: tableProperties
      };
      parameters.forEach(function(parameter, index) {
        var name = parameter.name;
        var value = tableProperties[index];
        switch (name) {
        case 'flags':
          value = value.split('|');
          break;
        case 'source':
          name = 'sources';
          break;
        }
        table[name] = table.properties[name] = value;
      });
      table.isArray           = table.flags.indexOf('TABLE_NO_KEY')   != -1;
      table.isHashTable       = table.flags.indexOf('TABLE_HASH_KEY') != -1;
      table.isPatriciaTrie    = table.flags.indexOf('TABLE_PAT_KEY')  != -1;
      table.isDoubleArrayTrie = table.flags.indexOf('TABLE_DAT_KEY')  != -1;
      table.hasKey = !table.isArray;
      if (table.isArray) {
        table.type = 'array';
      } else if (table.isHashTable) {
        table.type = 'hash table';
      } else if (table.isPatriciaTrie) {
        table.type = 'patricia trie';
      } else if (table.isDoubleArrayTrie) {
        table.type = 'double array trie';
      } else {
        table.type = 'unknown';
      }
      return table;
    });
  };
})();
