'use strict';

/**
 * @ngdoc function
 * @name groongaAdminApp.controller:ColumnNewController
 * @description
 * # ColumnNewController
 * Controller of the groongaAdminApp
 */
angular.module('groongaAdminApp')
  .controller('ColumnNewController', [
    '$scope', '$routeParams', '$location', '$http', 'schemaLoader',
    function ($scope, $routeParams, $location, $http, schemaLoader) {
      var schema;
      var client = new GroongaClient($http);

      function initialize() {
        $scope.table = {
          name: $routeParams.table
        };
        $scope.availableTypes = {
          scalar: {
            label: 'Scalar',
            flag: 'COLUMN_SCALAR'
          },
          vector: {
            label: 'Vector',
            flag: 'COLUMN_VECTOR'
          },
          index: {
            label: 'Index',
            flag: 'COLUMN_INDEX'
          }
        };
        $scope.availableValueTypes = {};
        $scope.column = {
          type: $scope.availableTypes.scalar,
          sources: []
        };
        $scope.submit = submit;
      }

      function submit() {
        var parameters = {
          table: $scope.table.name,
          name: $scope.column.name,
          flags: [$scope.column.type.flag].join('|'),
          type: $scope.column.valueType,
          source: $scope.column.sources.join(',')
        };
        var request = client.execute('column_create', parameters);
        request.success(function(response) {
          if (response.isCreated()) {
            schemaLoader().reload();
            $location.url('/tables/' + parameters.table +
                          '/columns/' + parameters.name);
          } else {
            var errorMessage = response.errorMessage();
            $scope.message = 'Failed to create the column: ' + errorMessage;
          }
        });
      }

      function collectAvailableValueTypes() {
        var types = [];
        angular.forEach(schema.types, function(type) {
          types.push(type.name);
        });
        angular.forEach(schema.tables, function(table) {
          types.push(table.name);
        });
        return types.sort();
      }

      initialize();
      schemaLoader()
        .then(function(_schema) {
          schema = _schema;
          $scope.availableValueTypes = collectAvailableValueTypes();
        });
    }]);
