'use strict';

/**
 * @ngdoc function
 * @name groongaAdminApp.controller:ColumnShowController
 * @description
 * # ColumnShowController
 * Controller of the groongaAdminApp
 */
angular.module('groongaAdminApp')
  .controller('ColumnShowController', [
    '$scope', '$routeParams', '$location', '$http', 'schemaLoader',
    function ($scope, $routeParams, $location, $http, schemaLoader) {
      var schema;
      var client = new GroongaClient($http);

      function initialize() {
        $scope.column = {
          name: $routeParams.column,
          table: {
            name: $routeParams.table
          }
        };
        $scope.remove = remove;
      }

      function remove() {
        if (!window.confirm('Really remove the column?')) {
          return;
        }

        var parameters = {
          table: $scope.column.table.name,
          name: $scope.column.name
        };
        var request = client.execute('column_remove', parameters);
        request.success(function(response) {
          console.log(response);
          if (response.isRemoved()) {
            schemaLoader().reload();
            $location.url('/tables/' + $scope.column.table.name + '/');
          } else {
            var errorMessage = response.errorMessage();
            $scope.message = 'Failed to remove the column: ' + errorMessage;
          }
        });
      }

      initialize();
      schemaLoader()
        .then(function(_schema) {
          schema = _schema;

          var table = schema.tables[$scope.column.table.name];
          var column = table.columns[$scope.column.name];
          angular.extend($scope.column, column);
        });
    }]);
