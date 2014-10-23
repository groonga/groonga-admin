'use strict';

/**
 * @ngdoc function
 * @name groongaAdminApp.controller:TableSearchController
 * @description
 * # TableSearchController
 * Controller of the groongaAdminApp
 */
angular.module('groongaAdminApp')
  .controller('TableSearchController', function ($scope, $routeParams, $http) {
    function escapeCommandValue(value) {
      return value.replace(/(["\\])/g, function(match) {
        return '\\' + match[1];
      });
    }

    function buildCommandLine(name, parameters) {
      var components = [name];
      for (var key in parameters) {
        if (key === 'callback') {
          continue;
        }
        components.push('--' + key);

        var value = parameters[key];
        components.push('"' + escapeCommandValue(value) + '"');
      }
      return components.join(' ');
    }

    $scope.table = $routeParams.table;
    $scope.columns = [];
    $scope.records = [];
    $scope.commandLine = '';
    $scope.message = '';
    $scope.elapsedTimeInMilliseconds = 0;
    $scope.nTotalRecords = 0;

    var parameters = {
      table: $scope.table,
      callback: 'JSON_CALLBACK'
    };
    $http.jsonp('/d/select.json', {params: parameters})
      .success(function(data) {
        $scope.commandLine = buildCommandLine('select', parameters);

        var response = new window.GroongaResponse.Select(data);
        $scope.elapsedTimeInMilliseconds = response.elapsedTime() * 1000;
        if (!response.isSuccess()) {
          $scope.message =
            'Failed to call "select" command: ' + response.errorMessage();
          $scope.nTotalRecords = 0;
          return;
        }
        $scope.nTotalRecords = response.nTotalRecords();
        $scope.columns = response.columns();
        $scope.records = response.records();
      });
  });
