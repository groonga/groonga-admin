'use strict';

/**
 * @ngdoc function
 * @name groongaAdminApp.controller:TopController
 * @description
 * # TopController
 * Controller of the groongaAdminApp
 */
angular.module('groongaAdminApp')
  .controller('TopController', [
    '$scope', 'schemaLoader',
    function ($scope, schemaLoader) {
      $scope.tables = [];
      schemaLoader()
        .then(function(schema) {
          angular.forEach(schema.tables, function(table) {
            $scope.tables.push(table);
          });
        });
    }]);
