'use strict';

// Declare app level module which depends on views, and components
angular.module('chatApp', [
  'ngRoute',
  'ngSanitize',
  'angular-smilies'
]).
config(['$locationProvider', '$routeProvider', function($locationProvider, $routeProvider) {
	$routeProvider.when('/chat', {
    templateUrl: '/views/chat.html',
    controller: 'ChatCtrl'
  }).when('/liveChat/:site/:lptag', {
    templateUrl: '/views/liveChat.html',
    controller: 'LiveChatCtrl'
  }).when('/error', {
    templateUrl: '/views/error.html',
    controller: 'errorCtrl'
  });
  $routeProvider.otherwise({redirectTo: '/chat'});
}]);
