
(function() {
  var app = angular.module('portfolio', ['ui.bootstrap.showErrors']);

  app.controller('ContactController', function($scope, $http) {
    $scope.formData = {};
    $scope.showError = false;
    $scope.showSuccess = false;

    $scope.submit = function() {

      $http({
        url: 'http://formspree.io/jonathan.trowbridge@gmail.com',
        method:"POST",
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        transformRequest: function(obj) {
           var str = [];
           for(var p in obj)
            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
           return str.join("&");
        },
        data: $scope.formData
      }).success(function(data, status, headers, config) {
        $scope.showError = false;
        $scope.showSuccess = true;
      }).error(function(data, status, headers, config) {
          // console.dir(arguments);
          if(status != 0) {
            $scope.showSuccess = false;
            $scope.showError = true;
          }
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
