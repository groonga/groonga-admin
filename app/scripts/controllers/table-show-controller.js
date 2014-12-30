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
          properties: [],
          columnPropertyNames: [],
          columns: []
        };
        $scope.tables = [];
      }

      initialize();
      schemaLoader()
        .then(function(_schema) {
          schema = _schema;

          var table = schema.tables[$scope.table.name];
          angular.forEach(table.properties, function(value, key) {
            $scope.table.properties.push({name: key, value: value});
          });
          var columns = [];
          angular.forEach(table.columns, function(value) {
            columns.push(value);
          });
          $scope.table.columns = columns.sort(function(column1, column2) {
            return (column1.name > column2.name) ? 1 : -1;
          });
          var representingColumn = columns.find(function(column) {
            return column.name[0] !== '_';
          });
          representingColumn = representingColumn || columns[0];
          if (representingColumn) {
            angular.forEach(representingColumn.properties, function(value, key) {
              $scope.table.columnPropertyNames.push(key);
            });
          }

          var tables = [];
          angular.forEach(schema.tables, function(value) {
            tables.push(value);
          });
          $scope.tables = tables.sort(function(table1, table2) {
            return (table1.name > table2.name) ? 1 : -1;
          });
        });
    }]);
