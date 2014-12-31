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
    '$scope', '$routeParams', '$filter', 'schemaLoader',
    function ($scope, $routeParams, $filter, schemaLoader) {
      var schema;

      function initialize() {
        $scope.column = {
          name: $routeParams.column,
          table: {
            name: $routeParams.table
          }
        };
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
