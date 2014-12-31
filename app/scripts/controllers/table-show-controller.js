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
    '$scope', '$routeParams', '$filter', 'schemaLoader',
    function ($scope, $routeParams, $filter, schemaLoader) {
      var schema;

      function initialize() {
        $scope.table = {
          name: $routeParams.table,
          columns: []
        };
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
