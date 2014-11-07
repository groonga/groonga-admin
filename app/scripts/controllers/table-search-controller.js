'use strict';

/**
 * @ngdoc function
 * @name groongaAdminApp.controller:TableSearchController
 * @description
 * # TableSearchController
 * Controller of the groongaAdminApp
 */
angular.module('groongaAdminApp')
  .controller('TableSearchController', function ($scope, $routeParams, $location, $http) {
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
      $scope.indexedColumns = [];
      $scope.allColumns = [];
      $scope.commandLine = '';
      $scope.message = '';
      $scope.currentPage = 1;
      $scope.nRecordsInPage = 10;
      $scope.maxNPages = 10;
      $scope.parameters = angular.copy($location.search());

      $scope.search = search;
      $scope.clear  = clear;
      $scope.toggleSort = toggleSort;
      $scope.selectDrilldown = selectDrilldown;
    }

    function packColumns(columns, filterFunction) {
      var targetColumnNames = columns
          .filter(filterFunction)
          .map(function(column) {
            return column.name;
          });
      return targetColumnNames.join(',');
    }

    function search() {
      var parameters = angular.copy($scope.parameters);
      parameters.match_columns =
        packColumns($scope.indexedColumns, function(column) {
          return column.inUse;
        });
      parameters.output_columns =
        packInUseColumns($scope.allColumns, function(column) {
          return column.inUse;
        });
      parameters.offset = ($scope.currentPage - 1) * $scope.nRecordsInPage;
      parameters.limit = $scope.nRecordsInPage;
      var sortKeys = $scope.columns.filter(function(column) {
        return column.sort;
      }).map(function(column) {
        if (column.sort === 'ascending') {
          return column.name;
        } else {
          return '-' + column.name;
        }
      }).join(',');
      parameters.sortby = sortKeys;
      $location.search(parameters);
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

    function selectDrilldown(key, value) {
      var query = $scope.parameters.query || '';
      if (query.length > 0) {
        query += ' ';
      }
      $scope.parameters.query = query + key + ':' + value;

      var drilldowns = ($scope.parameters.drilldown || '').split(/\s*,\s*/);
      drilldowns = drilldowns.filter(function(drilldown) {
        return drilldown !== key;
      });
      $scope.parameters.drilldown = drilldowns.join(',');

      search();
    }

    function createColumnInfo(name) {
      var outputColumns = $scope.parameters.output_columns;
      var inUse = true;
      if (outputColumns) {
        inUse = outputColumns.indexOf(name) !== -1;
      }
      var drilldown = false;
      return {
        name: name,
        inUse: inUse,
        drilldown: drilldown
      };
    }

    function extractColumnsInfo(table, columns) {
      if (table.name === $scope.table) {
        columns.forEach(function(column) {
          if (column.isIndex) {
            return;
          }
          $scope.allColumns.push(createColumnInfo(column.name));
        });
      }

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
          var inUse = true;
          if (matchColumns) {
            inUse = matchColumns.indexOf(localName) !== -1;
          }
          var drilldown = false;
          $scope.indexedColumns.push({
            name: localName,
            inUse: inUse,
            drilldown: drilldown
          });
        });
      });
    }

    function extractTableInfo(table) {
      if (table.name === $scope.table) {
        $scope.allColumns.push(createColumnInfo('_id'));
      }

      client.execute('column_list', {table: table.name})
        .success(function(response) {
          extractColumnsInfo(table, response.columns());
        });
    }

    function fillOptions() {
      client.execute('table_list')
        .success(function(response) {
          response.tables().forEach(function(table) {
            extractTableInfo(table);
          });
        });
    }

    function select() {
      var parameters = {
        table: $scope.table
      };
      angular.forEach($scope.parameters, function(value, key) {
        if (key in parameters) {
          return;
        }
        parameters[key] = value;
      });
      var request = client.execute('select', parameters);
      request.success(function(response) {
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
            return {
              value: value,
              column: $scope.response.columns[index]
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
    select();
  });
