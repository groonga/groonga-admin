'use strict';

/**
 * @ngdoc function
 * @name groongaAdminApp.controller:TableNewController
 * @description
 * # TableNewController
 * Controller of the groongaAdminApp
 */
angular.module('groongaAdminApp')
  .controller('TableNewController', [
    '$scope', '$http', '$location', 'schemaLoader',
    function ($scope, $http, $location, schemaLoader) {
      var schema;
      var client = new GroongaClient($http);

      function initialize() {
        $scope.availableTypes = {
          array: {
            label: 'Array',
            flag: 'TABLE_NO_KEY'
          },
          hashTable: {
            label: 'Hash table',
            flag: 'TABLE_HASH_KEY'
          },
          patriciaTrie: {
            label: 'Patricia trie',
            flag: 'TABLE_PAT_KEY'
          },
          doubleArrayTrie: {
            label: 'Double array trie',
            flag: 'TABLE_DAT_KEY'
          }
        };
        $scope.parameters = {
          type: $scope.availableTypes.array
        };
        $scope.tables = {
        };
        $scope.submit = submit;
      }

      function submit() {
        var parameters = {
          name: $scope.parameters.name,
          flags: [$scope.parameters.type.flag].join('|')
        };
        var request = client.execute('table_create', parameters);
        request.success(function(response) {
          if (response.isCreated()) {
            schemaLoader().reload();
            $location.url('/tables/' + parameters.name);
          } else {
            var errorMessage = response.errorMessage();
            $scope.message = 'Failed to create the table: ' + errorMessage;
          }
        });
      }

      initialize();
      schemaLoader()
        .then(function(_schema) {
          schema = _schema;

          $scope.tables = schema.tables;
        });
    }]);
