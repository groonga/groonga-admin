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
      .when('/tables/', {
        templateUrl: 'views/tables/index.html',
        controller: 'TableIndexController'
      })
      .when('/tables/:table/', {
        templateUrl: 'views/tables/show.html',
        controller: 'TableShowController'
      })
      .when('/tables/:table/search', {
        templateUrl: 'views/tables/search.html',
        controller: 'TableSearchController'
      })
      .when('/tables/:table/columns/:column', {
        templateUrl: 'views/columns/show.html',
        controller: 'ColumnShowController'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
