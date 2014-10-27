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
    function escapeCommandValue(value) {
      return value.replace(/(["\\])/g, function(match) {
        return '\\' + match[1];
      });
    }

    function buildCommandLine(name, parameters) {
      var components = [name];
      angular.forEach(parameters, function(value, key) {
        if (key === 'callback') {
          return;
        }

        components.push('--' + key);
        components.push('"' + escapeCommandValue(value) + '"');
      });
      return components.join(' ');
    }

    $scope.table = $routeParams.table;
    $scope.style = 'table';
    $scope.rawData = [];
    $scope.columns = [];
    $scope.records = [];
    $scope.commandLine = '';
    $scope.message = '';
    $scope.elapsedTimeInMilliseconds = 0;
    $scope.nTotalRecords = 0;
    $scope.parameters = angular.copy($location.search());

    $scope.search = function(parameters) {
      $location.search(parameters);
    };

    $scope.clear = function() {
      $location.search({});
    };

    var parameters = {
      table: $scope.table,
      callback: 'JSON_CALLBACK'
    };
    angular.forEach($scope.parameters, function(value, key) {
      if (key in parameters) {
        return;
      }
      parameters[key] = value;
    });
    $http.jsonp('/d/select.json', {params: parameters})
      .success(function(data) {
        $scope.rawData = data;

        $scope.commandLine = buildCommandLine('select', parameters);

        var response = new GroongaResponse.Select(data);
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
