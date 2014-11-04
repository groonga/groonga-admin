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
      $scope.rawData = [];
      $scope.columns = [];
      $scope.records = [];
      $scope.indexedColumns = [];
      $scope.outputColumns = [];
      $scope.commandLine = '';
      $scope.message = '';
      $scope.elapsedTimeInMilliseconds = 0;
      $scope.nTotalRecords = 0;
      $scope.nRecordsInPage = 10;
      $scope.maxNPages = 10;
      $scope.parameters = angular.copy($location.search());
      $scope.currentPage = computeCurrentPage($scope.parameters.offset || 0);

      $scope.search = search;
      $scope.clear  = clear;
    }

    function packInUseColumns(columns) {
      var targetColumnNames = columns
          .filter(function(column) {
            return column.inUse;
          })
          .map(function(column) {
            return column.name;
          });
      return targetColumnNames.join(',');
    }

    function search() {
      var parameters = angular.copy($scope.parameters);
      parameters.match_columns = packInUseColumns($scope.indexedColumns);
      parameters.output_columns = packInUseColumns($scope.outputColumns);
      parameters.offset = ($scope.currentPage - 1) * $scope.nRecordsInPage;
      parameters.limit = $scope.nRecordsInPage;
      $location.search(parameters);
    }

    function clear() {
      $location.search({});
    }

    function addOutputColumn(name) {
      var outputColumns = $scope.parameters.output_columns;
      var inUse = true;
      if (outputColumns) {
        inUse = outputColumns.indexOf(name) !== -1;
      }
      $scope.outputColumns.push({name: name, inUse: inUse});
    }

    function extractColumnsInfo(table, columns) {
      if (table.name === $scope.table) {
        columns.forEach(function(column) {
          if (column.isIndex) {
            return;
          }
          addOutputColumn(column.name);
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
          var localName = source.split('.')[1];
          var inUse = true;
          if (matchColumns) {
            inUse = matchColumns.indexOf(localName) !== -1;
          }
          $scope.indexedColumns.push({name: localName, inUse: inUse});
        });
      });
    }

    function extractTableInfo(table) {
      if (table.name === $scope.table) {
        addOutputColumn('_id');
        if (table.hasKey) {
          addOutputColumn('_key');
        }
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
        $scope.rawData = response.rawData();
        $scope.commandLine = request.commandLine();
        $scope.elapsedTimeInMilliseconds = response.elapsedTime() * 1000;
        if (!response.isSuccess()) {
          $scope.message =
            'Failed to call "select" command: ' + response.errorMessage();
          $scope.nTotalRecords = 0;
          return;
        }
        $scope.nTotalRecords = response.nTotalRecords();
        $scope.columns = response.columns();
        $scope.records = response.records().map(function(record) {
          return record.map(function(value, index) {
            return {
              value: value,
              column: $scope.columns[index]
            };
          });
        });
      });
    }

    initialize();
    fillOptions();
    select();
  });
