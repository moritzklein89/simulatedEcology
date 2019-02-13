/**
 * @ngdoc overview
 * @name texture
 * @description
 * # textureApp
 *
 * Main module of the application.
 */
var simulatedEcologyApp = angular.module('simulatedEcologyApp', ['ngSanitize', 'ngRoute']);

simulatedEcologyApp.config(['$locationProvider', function($locationProvider) {
	$locationProvider.hashPrefix('');
	$locationProvider.html5Mode(true);
}]);

simulatedEcologyApp.run([function () {

}])


