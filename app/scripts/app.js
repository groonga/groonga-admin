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
    'ui.bootstrap-slider'
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
      .when('/tables/_new', {
        templateUrl: 'views/tables/new.html',
        controller: 'TableNewController'
      })
      .when('/tables/:table/', {
        templateUrl: 'views/tables/show.html',
        controller: 'TableShowController'
      })
      .when('/tables/:table/search', {
        templateUrl: 'views/tables/search.html',
        controller: 'TableSearchController'
      })
      .when('/tables/:table/columns/_new', {
        templateUrl: 'views/columns/new.html',
        controller: 'ColumnNewController'
      })
      .when('/tables/:table/columns/:column', {
        templateUrl: 'views/columns/show.html',
        controller: 'ColumnShowController'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
