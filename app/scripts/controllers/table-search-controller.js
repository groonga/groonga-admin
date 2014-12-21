'use strict';

/**
 * @ngdoc function
 * @name groongaAdminApp.controller:TableSearchController
 * @description
 * # TableSearchController
 * Controller of the groongaAdminApp
 */
angular.module('groongaAdminApp')
  .controller('TableSearchController', [
    '$scope', '$routeParams', '$location', '$http', '$filter', 'schemaLoader',
    function ($scope, $routeParams, $location, $http, $filter, schemaLoader) {
      var schema;
      var client = new GroongaClient($http);

      function findElement(array, finder) {
        var i, length;
        length = array.length;
        for (i = 0; i < length; i++) {
          var element = array[i];
          if (finder(element)) {
            return element;
          }
        }
        return undefined;
      }

      function computeCurrentPage(offset) {
        return Math.ceil((parseInt(offset) + 1) / $scope.nRecordsInPage);
      }

      function initialize() {
        $scope.table = {
          name: $routeParams.table,
          allColumns: [],
          timeColumns: [],
          indexedColumns: []
        };
        $scope.style = 'table';
        $scope.response = {
          rawData: [],
          columns: [],
          records: [],
          drilldowns: [],
          elapsedTimeInMilliseconds: 0,
          nTotalRecords: 0
        };
        $scope.commandLine = '';
        $scope.message = '';
        $scope.parameters = angular.copy($location.search());
        if ($scope.parameters.limit && $scope.parameters.limit > 0) {
          $scope.nRecordsInPage = $scope.parameters.limit;
        } else {
          $scope.nRecordsInPage = 10;
        }
        $scope.currentPage = computeCurrentPage($scope.parameters.offset || 0);
        $scope.maxNPages = 10;

        $scope.search = search;
        $scope.incrementalSearch = incrementalSearch;
        $scope.clear  = clear;
        $scope.toggleSort = toggleSort;
        $scope.selectDrilldown = selectDrilldown;
      }

      function packColumns(columns) {
        var names = columns.map(function(column) {
          return column.name;
        });
        return names.join(',');
      }

      function packMatchColumns(columns) {
        var names = columns.map(function(column) {
          return column.indexName;
        });
        return names.join(',');
      }

      function packSortColumns(columns) {
        var keys = columns.map(function(column) {
          if (column.sort === 'ascending') {
            return column.name;
          } else {
            return '-' + column.name;
          }
        });
        return keys.join(',');
      }

      function toGroongaTime(date) {
        return '"' + $filter('date')(date, 'yyyy-MM-dd HH:mm:ss.sss') + '"';
      }

      function fromGroongaTime(time) {
        if (typeof time === 'number') {
          return new Date(time * 1000);
        } else {
          return new Date(time.replace(/ /, 'T'));
        }
      }

      function toBetweenBorder(included) {
        if (included) {
          return '"include"';
        } else {
          return '"exclude"';
        }
      }

      function fromBetweenBorder(border) {
        return border === 'include';
      }

      function buildFilter() {
        var timeQueries = $scope.table.timeColumns.filter(function(column) {
          return column.start || column.end;
        }).map(function(column) {
          var operator;
          var groongaTime;
          if (column.start && column.end) {
            return 'between(' + column.name + ', ' +
              toGroongaTime(column.start) + ', ' +
              toBetweenBorder(column.startIncluded) + ', ' +
              toGroongaTime(column.end) + ', ' +
              toBetweenBorder(column.endIncluded) + ')';
          } else if (column.start) {
            if (column.startIncluded) {
              operator = '>=';
            } else {
              operator = '>';
            }
            groongaTime = toGroongaTime(column.start);
            return column.name + ' ' + operator + ' ' + groongaTime;
          } else {
            if (column.endIncluded) {
              operator = '<=';
            } else {
              operator = '<';
            }
            groongaTime = toGroongaTime(column.end);
            return column.name + ' ' + operator + ' ' + groongaTime;
          }
        });

        return timeQueries.join(' && ');
      }

      function buildParameters() {
        var parameters = angular.copy($scope.parameters);

        var matchColumns = $scope.table.indexedColumns.filter(function(column) {
          return column.inUse;
        });
        parameters.match_columns = packMatchColumns(matchColumns);

        var outputColumns = $scope.table.allColumns.filter(function(column) {
          return column.output;
        });
        parameters.output_columns = packColumns(outputColumns);

        parameters.offset = ($scope.currentPage - 1) * $scope.nRecordsInPage;
        parameters.limit = $scope.nRecordsInPage;

        var sortColumns = $scope.table.allColumns.filter(function(column) {
          return column.sort;
        });
        parameters.sortby = packSortColumns(sortColumns);

        var drilldowns = $scope.table.allColumns.filter(function(column) {
          return column.drilldown;
        });
        parameters.drilldown = packColumns(drilldowns);

        parameters.drilldown_sortby = '-_nsubrecs';

        parameters.filter = buildFilter();

        return parameters;
      }

      function search() {
        $location.search(buildParameters());
      }

      function incrementalSearch() {
        select(buildParameters());
      }

      function clear() {
        $location.search({});
      }

      function setSortIconClass(column, sort) {
        switch (sort) {
        case 'ascending':
          column.iconClass = 'glyphicon-sort-by-attributes';
          break;
        case 'descending':
          column.iconClass = 'glyphicon-sort-by-attributes-alt';
          break;
        default:
          column.iconClass = 'glyphicon-sort';
          break;
        }
      }

      function toggleSort(column) {
        var columnInfo = findElement($scope.table.allColumns, function(columnInfo) {
          return columnInfo.name === column.name;
        });
        if (!columnInfo) {
          return;
        }

        var sort;
        switch (columnInfo.sort) {
        case 'ascending':
          sort = 'descending';
          break;
        case 'descending':
          sort = null;
          break;
        default:
          sort = 'ascending';
          break;
        }
        columnInfo.sort = sort;
        setSortIconClass(column, columnInfo.sort);
        incrementalSearch();
      }

      function selectDrilldown(key, value) {
        var queryKey = key;
        var column = findElement($scope.table.allColumns, function(column) {
          return column.name === key;
        });
        if (column) {
          if (column.isTableType) {
            queryKey += '._key';
          }
        }

        var escapedValue;
        if (typeof value === 'string') {
          escapedValue = '"' + value.replace('"', '\\"') + '"';
        } else {
          escapedValue = value.toString();
        }

        var query = $scope.parameters.query || '';
        if (query.length > 0) {
          query += ' ';
        }
        $scope.parameters.query = query + queryKey + ':' + escapedValue;

        var drilldowns = ($scope.parameters.drilldown || '').split(/\s*,\s*/);
        drilldowns = drilldowns.filter(function(drilldown) {
          return drilldown !== key;
        });
        $scope.parameters.drilldown = drilldowns.join(',');

        search();
      }

      function createColumnInfo(column) {
        var name = column.name;

        var output = true;
        var outputColumns = $scope.parameters.output_columns;
        if (outputColumns) {
          outputColumns = outputColumns.split(/\s*,\s*/);
          output = outputColumns.indexOf(name) !== -1;
        }

        var drilldown = false;
        var drilldowns = $scope.parameters.drilldown;
        if (drilldowns) {
          drilldowns = drilldowns.split(/\s*,\s*/);
          drilldown = drilldowns.indexOf(name) !== -1;
        }

        var sort = null;
        var sortKeys = ($scope.parameters.sortby || '').split(/\s*,\s*/);
        if (sortKeys.indexOf(column.name) !== -1) {
          sort = 'ascending';
        } else if (sortKeys.indexOf('-' + column.name) !== -1) {
          sort = 'descending';
        }

        return {
          name: name,
          type: column.range,
          output: output,
          drilldown: drilldown,
          sort: sort,
          indexes: column.indexes || [],
          isTextType: column.isTextType,
          isTableType: column.isTableType
        };
      }

      function addColumn(columnInfo) {
        $scope.table.allColumns.push(columnInfo);

        if (columnInfo.type === 'Time') {
          var timeColumnInfo = {
            name: columnInfo.name,
            start: null,
            startIncluded: true,
            end: null,
            endIncluded: true
          };
          $scope.table.timeColumns.push(timeColumnInfo);
        }

        var matchColumns = $scope.parameters.match_columns;
        columnInfo.indexes.forEach(function(/* index */) {
          var indexName = columnInfo.name;
          var inUse = true;
          if (matchColumns) {
            inUse = (matchColumns.indexOf(indexName) !== -1);
          }
          var indexedColumnInfo = {
            name: columnInfo.name,
            indexName: indexName,
            inUse: inUse
          };
          $scope.table.indexedColumns.push(indexedColumnInfo);
        });
      }

      function applyTimeQueries() {
        var filter = $scope.parameters.filter || '';
        var conditions = filter.split(/\s*(\|\||&&)\s*/);
        conditions.forEach(function(condition) {
          var parts;
          var columnName;
          var operator;
          var time;
          var timeColumn;
          if (/^between\(/.test(condition)) {
            parts = condition.split(/\s*[(,)]\s*/).map(function(part) {
              var matchData = part.match(/^"(.*)"$/);
              if (matchData) {
                return matchData[1];
              }
              matchData = part.match(/^\d+$/);
              if (matchData) {
                return parseInt(part);
              }
              matchData = part.match(/^\d+\.\d+$/);
              if (matchData) {
                return parseFloat(part);
              }
              return part;
            });
            columnName = parts[1];
            var start = parts[2];
            var startBorder = parts[3];
            var end = parts[4];
            var endBorder = parts[5];
            timeColumn = findElement($scope.table.timeColumns, function(column) {
              return column.name === columnName;
            });
            if (!timeColumn) {
              return;
            }
            timeColumn.start = fromGroongaTime(start);
            timeColumn.startBorder = fromBetweenBorder(startBorder);
            timeColumn.end = fromGroongaTime(end);
            timeColumn.endBorder = fromBetweenBorder(endBorder);
          } else if (/(<=|<|>|=>)/.test(condition)) {
            parts = condition.split(/(<=|<|>|=>)/);
            columnName = parts[0];
            operator = parts[1];
            time = parts[2];
            timeColumn = findElement($scope.table.timeColumns, function(column) {
              return column.name === columnName;
            });
            if (!timeColumn) {
              return;
            }
            switch (operator) {
            case '<=':
              timeColumn.end = fromGroongaTime(time);
              timeColumn.endBorder = 'include';
              break;
            case '<':
              timeColumn.end = fromGroongaTime(time);
              timeColumn.endBorder = 'exclude';
              break;
            case '>':
              timeColumn.start = fromGroongaTime(time);
              timeColumn.startBorder = 'exclude';
              break;
            case '>=':
              timeColumn.start = fromGroongaTime(time);
              timeColumn.startBorder = 'include';
              break;
            }
          }
        });
      }

      function select(userParameters) {
        var parameters = {
          table: $scope.table.name
        };
        angular.forEach(userParameters, function(value, key) {
          if (key in parameters) {
            return;
          }
          parameters[key] = value;
        });
        var request = client.execute('select', parameters);
        request.success(function(response) {
          $scope.message = '';
          $scope.response.rawData = response.rawData();
          $scope.commandLine = request.commandLine();
          $scope.response.elapsedTimeInMilliseconds =
            response.elapsedTime() * 1000;
          if (!response.isSuccess()) {
            $scope.message =
              'Failed to call "select" command: ' + response.errorMessage();
            $scope.response.nTotalRecords = 0;
            return;
          }
          $scope.currentPage = computeCurrentPage(parameters.offset || 0);
          $scope.response.nTotalRecords = response.nTotalRecords();
          $scope.response.columns = response.columns();
          $scope.response.columns.forEach(function(column) {
            var columnInfo = findElement($scope.table.allColumns, function(columnInfo) {
              return columnInfo.name === column.name;
            });
            if (columnInfo) {
              setSortIconClass(column, columnInfo.sort);
            }
          });
          $scope.response.records = response.records().map(function(record) {
            return record.map(function(value, index) {
              var column = $scope.response.columns[index];
              var formattedValue;
              if (column.type === 'Time') {
                var iso8601Format = 'yyyy-MM-ddTHH:mm:ss.sssZ';
                formattedValue = $filter('date')(value * 1000, iso8601Format);
              } else {
                formattedValue = value;
              }
              return {
                value: value,
                formattedValue: formattedValue,
                column: column
              };
            });
          });
          $scope.response.drilldowns = response.drilldowns();
          (parameters.drilldown || '')
            .split(/\s*,\s*/)
            .filter(function(drilldown) {
              return drilldown.length > 0;
            })
            .forEach(function(drilldown, i) {
              $scope.response.drilldowns[i].key = drilldown;
            });
        });
      }

      initialize();
      schemaLoader()
        .then(function(_schema) {
          schema = _schema;
          var table = schema.tables[$scope.table.name];
          angular.forEach(table.columns, function(column) {
            addColumn(createColumnInfo(column));
          });
          applyTimeQueries();

          var parameters = buildParameters();
          if ($scope.parameters.offset) {
            parameters.offset = $scope.parameters.offset;
          }
          select(parameters);
        });
    }]);
