
(function() {
  var app = angular.module('portfolio', ['ui.bootstrap.showErrors']);

  app.controller('ContactController', function($scope, $http) {
    $scope.formData = {};
    $scope.showError = false;
    $scope.showSuccess = false;

    $scope.submit = function() {

      $http.post('http://formspree.io/jonathan.trowbridge@gmail.com'
        , $scope.formData
      ).success(function(data, status, headers, config) {
        console.log('error');
        $scope.showError = false;
        $scope.showSuccess = true;
        $scope.formData = {};
        $scope.$broadcast('show-errors-reset');
      }).error(function(data, status, headers, config) {
        console.log('error');
        $scope.showSuccess = false;
        $scope.showError = true;
      });

    };

    $scope.reset = function() {
      $scope.formData = {};
      $scope.$broadcast('show-errors-reset');
      $scope.showSuccess = false;
      $scope.showError = false;
    };

  });


})();
