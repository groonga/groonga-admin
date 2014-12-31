'use strict';

/**
 * @ngdoc function
 * @name groongaAdminApp.controller:TableIndexController
 * @description
 * # TableIndexController
 * Controller of the groongaAdminApp
 */
angular.module('groongaAdminApp')
  .controller('TableIndexController', [
    '$scope', 'schemaLoader',
    function ($scope, schemaLoader) {
      var schema;

      function initialize() {
        $scope.tables = [];
      }

      initialize();
      schemaLoader()
        .then(function(_schema) {
          schema = _schema;

          var tables = [];
          angular.forEach(schema.tables, function(value) {
            tables.push(value);
          });
          $scope.tables = tables.sort(function(table1, table2) {
            return (table1.name > table2.name) ? 1 : -1;
          });
        });
    }]);
