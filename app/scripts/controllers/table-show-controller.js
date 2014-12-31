'use strict';

/**
 * @ngdoc function
 * @name groongaAdminApp.controller:TableShowController
 * @description
 * # TableShowController
 * Controller of the groongaAdminApp
 */
angular.module('groongaAdminApp')
  .controller('TableShowController', [
    '$scope', '$routeParams', '$http', '$location', 'schemaLoader',
    function ($scope, $routeParams, $http, $location, schemaLoader) {
      var schema;
      var client = new GroongaClient($http);

      function initialize() {
        $scope.table = {
          name: $routeParams.table,
          columns: []
        };
        $scope.remove = remove;
      }

      function remove() {
        if (!window.confirm('Really remove the table?')) {
          return;
        }

        var request = client.execute('table_remove', {name: $scope.table.name});
        request.success(function(response) {
          console.log(response);
          if (response.isRemoved()) {
            schemaLoader().reload();
            $location.url('/tables/');
          } else {
            var errorMessage = response.errorMessage();
            $scope.message = 'Failed to remove the table: ' + errorMessage;
          }
        });
      }

      initialize();
      schemaLoader()
        .then(function(_schema) {
          schema = _schema;

          var table = schema.tables[$scope.table.name];
          angular.extend($scope.table, table);
          var columns = [];
          angular.forEach(table.columns, function(value) {
            columns.push(value);
          });
          $scope.table.columns = columns.sort(function(column1, column2) {
            return (column1.name > column2.name) ? 1 : -1;
          });
        });
    }]);
