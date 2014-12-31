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
      var schema = {
        tables: {}
      };
      var client = new GroongaClient($http);

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

      function isReferenceType(typeName) {
        return typeName in schema.tables;
      }

      function resolveTable(table) {
        table.keyType = {
          name: table.domain,
          isTextType: isTextType(table.domain)
        };
      }

      function resolveTables() {
        angular.forEach(schema.tables, function(table) {
          resolveTable(table);
        });
      }

      function resolveColumn(column) {
        column.valueType = {
          name: column.range,
          isTextType: isTextType(column.range),
          isReferenceType: isReferenceType(column.range)
        };
      }

      function resolveColumns() {
        angular.forEach(schema.tables, function(table) {
          angular.forEach(table.columns, function(column) {
            resolveColumn(column);
          });
        });
      }

      function resolveIndex(column) {
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

      function resolveIndexes() {
        angular.forEach(schema.tables, function(table) {
          angular.forEach(table.columns, function(column) {
            if (column.isIndex) {
              resolveIndex(column);
            }
          });
        });
      }

      function addColumn(table, column) {
        column.table = table;
        column.indexes = [];
        table.columns[column.name] = column;
      }

      function addIDColumn(table) {
        var properties = {
          id: table.id,
          name: '_id',
          type: 'fix',
          flags: ['COLUMN_SCALAR', 'PERSISTENT'],
          domain: table.name,
          range: 'UInt32',
          sources: []
        };

        var rawProperties = angular.copy(properties);
        rawProperties.source = rawProperties.sources;
        delete rawProperties.sources;
        rawProperties.flags = rawProperties.flags.join('|');

        var IDColumn = angular.copy(properties);
        IDColumn.rawProperties = rawProperties;
        IDColumn.properties = properties;

        addColumn(table, IDColumn);
      }

      function fetchColumns(table) {
        table.columns = {};

        addIDColumn(table);

        return client.execute('column_list', {table: table.name})
          .success(function(response) {
            var columns = response.columns();

            columns.forEach(function(column) {
              addColumn(table, column);
            });
          });
      }

      function fetchTables() {
        return client.execute('table_list')
          .success(function(response) {
            response.tables().forEach(function(table) {
              schema.tables[table.name] = table;
            });
            resolveTables();

            var fetchColumnsTasks = [];
            angular.forEach(schema.tables, function(table) {
              fetchColumnsTasks.push(fetchColumns(table));
            });

            return $q.all(fetchColumnsTasks)
              .then(function() {
                resolveColumns();
                resolveIndexes();
                fetched = true;
                fetching = false;
                waitingDeferes.forEach(function(defer) {
                  defer.resolve(schema);
                });
                waitingDeferes = [];
                return schema;
              });
          });
      }

      return function() {
        var defer;
        if (fetching) {
          defer = $q.defer();
          waitingDeferes.push(defer);
          return defer.promise;
        } else if (fetched) {
          defer = $q.defer();
          $timeout(function() {
            defer.resolve(schema);
          });
          return defer.promise;
        } else {
          fetching = true;
          return fetchTables();
        }
      };
    }]);
