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
        return newSchema;
      }

      function buildTypes(rawTypes) {
        var types = {};
        angular.forEach(rawTypes, function(rawType, name) {
          types[name] = {
            name: rawType.name
          };
        });
        return types;
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

      function buildTable(rawTypes, rawTable) {
        var table = {};
        table.id           = 0; // XXX it exists in a table_list response but missing in a schema response.
        table.name         = rawTable.name;
        table.path         = ''; // XXX it exists in a table_list response but missing in a schema response.
        table.valueType    = rawTable.value_type && rawTable.value_type.name;
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

        table.isArray           = table.type === 'array';
        table.isHashTable       = table.type === 'hash table';
        table.isPatriciaTrie    = table.type === 'patricia trie';
        table.isDoubleArrayTrie = table.type === 'double attay trie';
        table.hasKey            = !table.isArray;

        table.range  = table.valueType; // for backward compatibility
        table.domain = table.keyType && table.keyType.name; // for backward compatibility

        table.columns = buildColumns(rawTypes, rawTable);

        return table;
      }

      function buildTables(rawTypes, rawTables) {
        var tables = {};
        angular.forEach(rawTables, function(rawTable, name) {
          tables[name] = buildTable(rawTypes, rawTable);
        });
        return tables;
      }

      function resolveIndexes(schema) {
        angular.forEach(schema.tables, function(table) {
          angular.forEach(table.columns, function(column) {
            column.indexes = column.indexes.map(function(index) {
              return schema.tables[index.table].columns[index.name];
            });
          });
        });
      }

      function buildColumn(rawTable, rawColumn) {
        var column = {};
        column.id       = rawColumn.id || 0;
        column.name     = rawColumn.name;
        column.path     = rawColumn.path || '';
        column.type     = rawColumn.type;
        // TODO: Wrong. It should be 'fix' or 'var'. It can be removable.
        column.sizeType = rawColumn.type;
        column.table    = rawTable;

        column.flags = rawColumn.command.arguments.flags.split('|');

        column.sources = rawColumn.sources.map(function(source) {
          return source.full_name.replace(/\._key$/, '');
        });

        column.valueType = {
          name: rawColumn.value_type.name,
          isTextType: isTextType(rawColumn.value_type.name),
          isReferenceType: rawColumn.value_type.type === 'reference'
        };

        column.isScalar = column.type === 'scalar';
        column.isVector = column.type === 'vector';
        column.isIndex  = column.type === 'index';

        column.range  = column.valueType && column.valueType.name; // for backward compatibility
        column.domain = rawTable.name; // for backward compatibility

        column.indexes = rawColumn.indexes || [];
        return column;
      }

      function buildColumns(rawTypes, rawTable) {
        var columns = {};

        rawTable.columns._id = {
          id:        0,
          name:      '_id',
          table:     rawTable.name,
          full_name: rawTable.name + '._id',
          type:      'scalar',
          value_type: {
            id:   rawTypes.UInt32.id,
            name: 'UInt32',
            type: 'type'
          },
          compress:  null,
          section:   false,
          weight:    false,
          position:  false,
          sources:   [],
          indexes:   [],
          command: {
            arguments: {
              flags: 'COLUMN_SCALAR'
            }
          }
        };

        if (rawTable.type !== 'array') {
          rawTable.columns._key = {
            id:        0,
            name:      '_key',
            table:     rawTable.name,
            full_name: rawTable.name + '._key',
            type:      'scalar',
            value_type: rawTable.key_type,
            compress:  null,
            section:   false,
            weight:    false,
            position:  false,
            sources:   [],
            indexes:   rawTable.indexes || [],
            command: {
              arguments: {
                flags: 'COLUMN_SCALAR'
              }
            }
          };
        }

        angular.forEach(rawTable.columns, function(rawColumn, name) {
          columns[name] = buildColumn(rawTable, rawColumn);
        });

        return columns;
      }

      var THREAD_LIMIT_UNKNOWN = 0;
      function setThreadLimit(limit) {
        return client.execute('thread_limit', { max: limit })
          .then(function(response) {
            return response.lastMaxLimit();
          }, function(/* errorResponse */) {
            return THREAD_LIMIT_UNKNOWN;
          });
      }

      function fetchSchema(schema) {
        schema.tables = {};
        var lastMaxLimitBackup;
        return setThreadLimit(1)
          .then(function(lastMaxLimit) {
            lastMaxLimitBackup = lastMaxLimit;
          })
          .then(function() {
            return client.execute('schema')
                    .then(function(response) {
                      schema.types = buildTypes(response.types());
                      schema.tables = buildTables(response.types(),
                                                  response.tables());
                      resolveIndexes(schema);
                    }, function(/* errorResponse */) {});
          })
          .then(function() {
            if (lastMaxLimitBackup === THREAD_LIMIT_UNKNOWN) {
              return;
            }
            return setThreadLimit(lastMaxLimitBackup);
          })
          .then(function() {
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
