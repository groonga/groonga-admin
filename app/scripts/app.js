'use strict';

/**
 * @ngdoc overview
 * @name groongaAdminApp
 * @description
 * # groongaAdminApp
 *
 * Main module of the application.
 */
angular
  .module('groongaAdminApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'ui.bootstrap',
    'ui.bootstrap.datetimepicker'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/top.html',
        controller: 'TopController'
      })
      .when('/tables/:table/search', {
        templateUrl: 'views/tables/search.html',
        controller: 'TableSearchController'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
