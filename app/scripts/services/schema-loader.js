'use strict';

/**
 * @ngdoc function
 * @name groongaAdminApp.service:schemaLoader
 * @description
 * # schemaLoader
 * Groonga database schema loader.
 */
angular.module('groongaAdminApp')
  .factory('schemaLoader', [
    '$q', '$http', '$timeout',
    function ($q, $http, $timeout) {
      var fetching = false;
      var waitingDeferes = [];
      var fetched = false;
      var schema;
      var client = new GroongaClient($http);

      function createSchema() {
        var newSchema = {};
        fillTypes(newSchema);
        return newSchema;
      }

      function fillTypes(schema) {
        var builtinTypes = [
          {
            name: 'Bool'
          },
          {
            name: 'Int8'
          },
          {
            name: 'UInt8'
          },
          {
            name: 'Int16'
          },
          {
            name: 'UInt16'
          },
          {
            name: 'Int32'
          },
          {
            name: 'UInt32'
          },
          {
            name: 'Int64'
          },
          {
            name: 'UInt64'
          },
          {
            name: 'Float'
          },
          {
            name: 'Time'
          },
          {
            name: 'ShortText'
          },
          {
            name: 'Text'
          },
          {
            name: 'LongText'
          },
          {
            name: 'TokyoGeoPoint'
          },
          {
            name: 'WGS84GeoPoint'
          }
        ];
        schema.types = {};
        angular.forEach(builtinTypes, function(type) {
          schema.types[type.name] = type;
        });
      }

      function isTextType(typeName) {
        switch (typeName) {
        case 'ShortText':
        case 'Text':
        case 'LongText':
          return true;
        default:
          return false;
        }
      }

      function buildTable(rawTable) {
        var table = {};
        table.id           = 0; // XXX it exists in a table_list response but missing in a schema response.
        table.name         = rawTable.name;
        table.path         = ''; // XXX it exists in a table_list response but missing in a schema response.
        table.valueType    = rawTable.value_type && rawTable.value_type.name
        table.tokenizer    = rawTable.tokenizer && rawTable.tokenizer.name;
        table.normalizer   = rawTable.normalizer && rawTable.normalizer.name;
        table.type         = rawTable.type;

        table.flags = [];
        if (rawTable.command &&
            rawTable.command.arguments &&
            rawTable.command.arguments.flags)
          table.flags = rawTable.command.arguments.flags.split('|');

        table.tokenFilters = '';
        if (rawTable.token_filters)
          table.tokenFilters = rawTable.token_filters.join('|'); // XXX what is the correct delimiter?

        table.keyType = null;
        if (rawTable.key_type) {
          table.keyType = {
            name: rawTable.key_type.name,
            isTextType: isTextType(rawTable.key_type.name)
          };
        }

        table.isArray           = table.type == 'array';
        table.isHashTable       = table.type == 'hash table';
        table.isPatriciaTrie    = table.type == 'patricia trie';
        table.isDoubleArrayTrie = table.type == 'double attay trie';
        table.hasKey            = !table.isArray;

        table.range  = table.valueType; // for backward compatibility
        table.domain = table.keyType && table.keyType.name; // for backward compatibility

        return table;
      }

      function buildTables(rawTables) {
        var tables = {};
        angular.forEach(rawTables, function(table, name) {
          tables[name] = buildTable(table);
        });
        return tables;
      }

      function resolveIndex(schema, column) {
        var table = schema.tables[column.range];
        column.sources.forEach(function(source) {
          var columnName;
          if (source.indexOf('.') === -1) {
            columnName = '_key';
          } else {
            columnName = source.split('.')[1];
          }
          var targetColumn = table.columns[columnName];
          targetColumn.indexes.push(column);
        });
      }

      function resolveIndexes(schema) {
        angular.forEach(schema.tables, function(table) {
          angular.forEach(table.columns, function(column) {
            if (column.isIndex) {
              resolveIndex(schema, column);
            }
          });
        });
      }

      function buildColumn(rawTable, rawColumn) {
        var column = {};
        column.id       = 0; // XXX it exists in a table_list response but missing in a schema response.
        column.name     = rawColumn.name;
        column.path     = ''; // XXX it exists in a table_list response but missing in a schema response.
        column.type     = rawColumn.type;
        column.sizeType = rawColumn.type;
        column.table    = rawTable;

        column.flags = [];
        if (rawColumn.command &&
            rawColumn.command.arguments &&
            rawColumn.command.arguments.flags)
          column.flags = rawColumn.command.arguments.flags.split('|');

        column.sources = [];
        if (rawColumn.sources)
          column.sources = rawColumn.sources.map(function(source) {
            return source.full_name.replace(/\._key$/, '');
          });

        column.valueType = null;
        if (rawColumn.value_type)
          column.valueType = {
            name: rawColumn.value_type.name,
            isTextType: isTextType(rawColumn.value_type.name),
            isReferenceType: rawColumn.value_type.type == 'reference'
          };

        column.isScalar = column.type == 'scalar';
        column.isVector = column.type == 'vector';
        column.isIndex  = column.type == 'index';

        column.range  = column.valueType && column.valueType.name; // for backward compatibility
        column.domain = rawTable.name; // for backward compatibility

        column.indexes = [];
        return column;
      }

      function buildColumns(rawTable) {
        var columns = {};

        columns._id = {
          name:    '_id',
          id:      rawTable.id || 0,
          path:    rawTable.path || '',
          type:    'scalar',
          flags:   ['COLUMN_SCALAR', 'PERSISTENT'],
          domain:  rawTable.name,
          range:   'UInt32',
          sources: []
        };

        if (rawTable.type != 'array') {
          columns._key = {
            name:    '_key',
            id:      rawTable.id || 0,
            path:    '',
            type:    'scalar',
            flags:   ['COLUMN_SCALAR'],
            domain:  rawTable.name,
            range:   rawTable.key_type.name,
            sources: [],
            indexes: []
          };
        }

        angular.forEach(rawTable.columns, function(rawColumn, name) {
          columns[name] = buildColumn(rawTable, rawColumn);
        });

        return columns;
      }

      function fetchColumns(table) {
        return client.execute('schema')
          .success(function(response) {
            table.columns = buildColumns(response.tables()[table.name]);
          });
      }

      function fetchSchema(schema) {
        schema.tables = {};
        return client.execute('schema')
          .success(function(response) {
            var rawTables = response.tables();

            schema.tables = buildTables(rawTables);

            angular.forEach(schema.tables, function(table) {
              table.columns = buildColumns(rawTables[table.name]);
            });

            resolveIndexes(schema);
            fetched = true;
            fetching = false;
            waitingDeferes.forEach(function(defer) {
              defer.resolve(schema);
            });
            waitingDeferes = [];
            return schema;
          });
      }

      schema = createSchema();

      return function() {
        var defer;
        var loader;
        if (fetching) {
          defer = $q.defer();
          waitingDeferes.push(defer);
          loader = defer.promise;
        } else if (fetched) {
          defer = $q.defer();
          $timeout(function() {
            defer.resolve(schema);
          });
          loader = defer.promise;
        } else {
          fetching = true;
          loader = fetchSchema(schema);
        }
        loader.reload = function() {
          fetching = false;
          fetched = false;
          schema = createSchema();
        };
        return loader;
      };
    }]);
