
(function() {
  var app = angular.module('portfolio', ['ui.bootstrap.showErrors']);

  app.controller('ContactController', function($scope, $http) {
    $scope.formData = {};
    $scope.showError = false;
    $scope.showSuccess = false;

    $scope.submit = function() {
      var tmp = [];
      var keys = Object.keys($scope.formData);

      for(var i = 0; i < keys.length; i++) {
        tmp.push({
          name: keys[i]
          , value: $scope.formData[keys[i]]
        });
      }

      console.dir(tmp);


      $http.post('http://formspree.io/jonathan.trowbridge@gmail.com'
        , tmp
      ).success(function(data, status, headers, config) {
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
