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
    $scope.table = $routeParams.table;
    $scope.style = 'table';
    $scope.rawData = [];
    $scope.columns = [];
    $scope.records = [];
    $scope.indexedColumns = [];
    $scope.commandLine = '';
    $scope.message = '';
    $scope.elapsedTimeInMilliseconds = 0;
    $scope.nTotalRecords = 0;
    $scope.parameters = angular.copy($location.search());

    $scope.search = function() {
      var parameters = angular.copy($scope.parameters);
      parameters.match_columns = $scope.indexedColumns
        .filter(function(indexedColumn) {
          return indexedColumn.inUse;
        })
        .map(function(indexedColumn) {
          return indexedColumn.name;
        })
        .join(',');
      $location.search(parameters);
    };

    $scope.clear = function() {
      $location.search({});
    };

    var client = new GroongaClient($http);
    client.execute('table_list')
      .success(function(response) {
        response.tables().forEach(function(table) {
          client.execute('column_list', {table: table.name})
            .success(function(response) {
              response.columns().forEach(function(column) {
                if (!column.isIndex) {
                  return;
                }
                if (column.range !== $scope.table) {
                  return;
                }
                var matchColumns = $scope.parameters['match_columns'] || [];
                column.sources.forEach(function(source) {
                  var localName = source.split('.')[1];
                  var inUse = matchColumns.indexOf(localName) !== -1;
                  $scope.indexedColumns.push({name: localName, inUse: inUse});
                });
              });
            });
        });
      });

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
  });
