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
    $http.jsonp('/d/table_list', {params: {callback: 'JSON_CALLBACK'}})
      .success(function(data) {
        var response = new GroongaResponse.TableList(data);
        $scope.tables = response.tables();
        console.log($scope.tables);
      });
  });
