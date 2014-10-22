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
    'ngTouch'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .when('/tables/:table/search', {
        templateUrl: 'views/tables/search.html',
        controller: 'TableSearchController'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
