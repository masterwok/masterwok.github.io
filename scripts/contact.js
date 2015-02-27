
(function() {
  var app = angular.module('portfolio', ['ui.bootstrap.showErrors']);

  app.controller('ContactController', function($scope, $http) {
    $scope.formData = {};
    $scope.showError = false;
    $scope.showSuccess = false;

    $scope.submit = function() {

      // $http.post('http://formspree.io/jonathan.trowbridge@gmail.com'
      //   , $scope.formData
      // ).success(function(data, status, headers, config) {
      //   $scope.showError = false;
      //   $scope.showSuccess = true;
      // }).error(function(data, status, headers, config) {
      //   $scope.showSuccess = false;
      //   $scope.showError = true;
      // });

      $http({
             url: 'http://formspree.io/jonathan.trowbridge@gmail.com',
             method:"POST",
             headers: {
                        'Content-Type': 'application/json'
             },
             data: $scope.formData
        });

      // $http.post({
      //   url: 'http://formspree.io/jonathan.trowbridge@gmail.com',
      //   dataType: "json",
      //   method: "POST",
      //   headers: {
      //       "Content-Type": "application/json"
      //   }
      // }).success(function(data, status, headers, config) {
      //   $scope.showError = false;
      //   $scope.showSuccess = true;
      // }).error(function(data, status, headers, config) {
      //   $scope.showSuccess = false;
      //   $scope.showError = true;
      // });

    };

    $scope.reset = function() {
      $scope.formData = {};
      $scope.$broadcast('show-errors-reset');
      $scope.showSuccess = false;
      $scope.showError = false;
    };

  });


})();
