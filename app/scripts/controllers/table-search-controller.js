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
      $scope.parameters = angular.copy($location.search());

      $scope.search = search;
      $scope.clear  = clear;
    }

    function search() {
      var matchColumns = $scope.indexedColumns
          .filter(function(indexedColumn) {
            return indexedColumn.inUse;
          })
          .map(function(indexedColumn) {
            return indexedColumn.name;
          })
          .join(',');
      var outputColumns = $scope.outputColumns
          .filter(function(outputColumn) {
            return outputColumn.inUse;
          })
          .map(function(outputColumn) {
            return outputColumn.name;
          })
          .join(',');
      var parameters = angular.extend({},
                                      $scope.parameters,
                                      {
                                        'match_columns':  matchColumns,
                                        'output_columns': outputColumns
                                      });
      $location.search(parameters);
    }

    function clear() {
      $location.search({});
    }

    function fillOptions() {
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
            });
          });
        });

      client.execute('column_list', {table: $scope.table})
        .success(function(response) {
          var outputColumns = $scope.parameters.output_columns;
          console.log(response.columns());
          response.columns().forEach(function(column) {
            if (column.isIndex) {
              return;
            }
            var inUse = true;
            if (outputColumns) {
              inUse = outputColumns.indexOf(column.name) !== -1;
            }
            $scope.outputColumns.push({name: column.name, inUse: inUse});
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
