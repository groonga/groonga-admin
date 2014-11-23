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
    '$scope', '$routeParams', '$location', '$q', '$http', '$filter',
    function ($scope, $routeParams, $location, $q, $http, $filter) {
      var client = new GroongaClient($http);

      function computeCurrentPage(offset) {
        return Math.ceil((parseInt(offset) + 1) / $scope.nRecordsInPage);
      }

      function initialize() {
        $scope.table = $routeParams.table;
        $scope.style = 'table';
        $scope.response = {
          rawData: [],
          columns: [],
          records: [],
          drilldowns: [],
          elapsedTimeInMilliseconds: 0,
          nTotalRecords: 0
        };
        $scope.allTables = [];
        $scope.allColumns = [];
        $scope.timeColumns = [];
        $scope.indexedColumns = [];
        $scope.commandLine = '';
        $scope.message = '';
        $scope.currentPage = 1;
        $scope.nRecordsInPage = 10;
        $scope.maxNPages = 10;
        $scope.parameters = angular.copy($location.search());

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
        var timeQueries = $scope.timeColumns.filter(function(column) {
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

        var matchColumns = $scope.indexedColumns.filter(function(column) {
          return column.inUse;
        });
        parameters.match_columns = packColumns(matchColumns);

        var outputColumns = $scope.allColumns.filter(function(column) {
          return column.output;
        });
        parameters.output_columns = packColumns(outputColumns);

        parameters.limit = $scope.nRecordsInPage;

        var sortColumns = $scope.response.columns.filter(function(column) {
          return column.sort;
        });
        parameters.sortby = packSortColumns(sortColumns);

        var drilldowns = $scope.allColumns.filter(function(column) {
          return column.drilldown;
        });
        parameters.drilldown = packColumns(drilldowns);

        parameters.drilldown_sortby = '-_nsubrecs';

        parameters.filter = buildFilter();

        return parameters;
      }

      function search() {
        var parameters = buildParameters();
        parameters.offset = ($scope.currentPage - 1) * $scope.nRecordsInPage;
        $location.search(parameters);
      }

      function incrementalSearch() {
        select(buildParameters());
      }

      function clear() {
        $location.search({});
      }

      function setColumnSort(column, sort) {
        column.sort = sort;
        switch (column.sort) {
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
        var sort;
        switch (column.sort) {
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
        setColumnSort(column, sort);
        search();
      }

      function isTableType(type) {
        return $scope.allTables.some(function(table) {
          return table.name === type;
        });
      }

      function isTextType(type) {
        switch (type) {
        case 'ShortText':
        case 'Text':
        case 'LongText':
          return true;
        default:
          return false;
        }
      }

      function selectDrilldown(key, value) {
        var queryKey = key;
        var column = $scope.allColumns.find(function(column) {
          return column.name === key;
        });
        if (column) {
          if (isTableType(column.type)) {
            queryKey += '._key';
          }
        }

        var escapedValue = '"' + value.replace('"', '\\"') + '"';

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

        return {
          name: name,
          type: column.range,
          output: output,
          drilldown: drilldown
        };
      }

      function addColumn(columnInfo) {
        $scope.allColumns.push(columnInfo);
        if (columnInfo.type === 'Time') {
          var timeColumnInfo = {
            name: columnInfo.name,
            start: null,
            startIncluded: true,
            end: null,
            endIncluded: true
          };
          $scope.timeColumns.push(timeColumnInfo);
        }
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
            timeColumn = $scope.timeColumns.find(function(column) {
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
            timeColumn = $scope.timeColumns.find(function(column) {
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

      function extractColumnsInfo(table, columns) {
        columns.forEach(function(column) {
          if (!column.isIndex) {
            return;
          }
          if (column.range !== $scope.table) {
            return;
          }
          var matchColumns = $scope.parameters.match_columns;
          column.sources.forEach(function(source) {
            var localName;
            if (source.indexOf('.') === -1) {
              localName = '_key';
            } else {
              localName = source.split('.')[1];
            }

            var indexName = localName;
            var sourceColumn = $scope.allColumns.find(function(column) {
              return column.name === localName;
            });
            if (sourceColumn) {
              var targetType = sourceColumn.type;
              var isTableTypeSource = isTableType(targetType);
              if (isTableTypeSource) {
                var table = $scope.allTables.find(function(table) {
                  return table.name === targetType;
                });
                targetType = table.domain;
              }
              if (!isTextType(targetType)) {
                return;
              }

              if (isTableTypeSource) {
                indexName += '._key';
              }
            }

            var inUse = true;
            if (matchColumns) {
              inUse = matchColumns.indexOf(indexName) !== -1;
            }

            $scope.indexedColumns.push({
              name: indexName,
              label: localName,
              inUse: inUse
            });
          });
        });
      }

      function extractTableInfo(table) {
        return client.execute('column_list', {table: table.name})
          .success(function(response) {
            extractColumnsInfo(table, response.columns());
          });
      }

      function fillOptions() {
        client.execute('table_list')
          .success(function(response) {
            $scope.allTables = response.tables();

            var idColumn = {
              name: '_id',
              range: 'UInt32'
            };
            addColumn(createColumnInfo(idColumn));

            client.execute('column_list', {table: $scope.table})
              .success(function(response) {
                var columns = response.columns();

                columns.forEach(function(column) {
                  if (column.isIndex) {
                    return;
                  }
                  addColumn(createColumnInfo(column));
                });
                applyTimeQueries();

                var currentTable = $scope.allTables.find(function(table) {
                  return table.name === $scope.table;
                });
                extractColumnsInfo(currentTable, columns);

                var tasks = [];
                $scope.allTables.forEach(function(table) {
                  if (table.name === $scope.table) {
                    return;
                  }
                  tasks.push(extractTableInfo(table));
                });
                $q.all(tasks)
                  .then(function() {
                    select(buildParameters());
                  });
              });
          });
      }

      function select(userParameters) {
        var parameters = {
          table: $scope.table
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
          var sortKeys = ($scope.parameters.sortby || '').split(/\s*,\s*/);
          $scope.response.columns = response.columns().map(function(column) {
            var sort = null;
            if (sortKeys.indexOf(column.name) !== -1) {
              sort = 'ascending';
            } else if (sortKeys.indexOf('-' + column.name) !== -1) {
              sort = 'descending';
            }
            setColumnSort(column, sort);
            return column;
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
          ($scope.parameters.drilldown || '')
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
      fillOptions();
    }]);
