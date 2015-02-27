
(function() {
  var app = angular.module('portfolio', ['ui.bootstrap.showErrors']);

  app.controller('ContactController', function($scope, $http) {
    $scope.formData = {};
    $scope.showError = false;
    $scope.showSuccess = false;

    $scope.submit = function() {
      $http.post({
        url: 'http://formspree.io/jonathan.trowbridge@gmail.com'
        , data: $scope.formData.serializeArray()
      }).success(function(data, status, headers, config) {
        $scope.showError = false;
        $scope.showSuccess = true;
      }).error(function(data, status, headers, config) {
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
