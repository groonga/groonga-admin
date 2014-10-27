'use strict';

/**
 * @ngdoc function
 * @name groongaAdminApp.controller:TopController
 * @description
 * # TopController
 * Controller of the groongaAdminApp
 */
angular.module('groongaAdminApp')
  .controller('TopController', function ($scope, $http) {
    $scope.tables = [];
    var client = new GroongaClient($http);
    var request = client.execute('table_list', {});
    request.success(function(response) {
        $scope.tables = response.tables();
      });
  });
