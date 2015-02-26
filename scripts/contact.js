
(function() {
  var app = angular.module('portfolio', []);

  app.controller('ContactController', function($scope) {
    $scope.email = null;
    $scope.contactName = null;
    $scope.message = null;

    this.submit = function() {
      // action="http://formspree.io/jonathan.trowbridge@gmail.com"
      // method="POST"
      console.log("ng-submit hit!");
    };

    this.reset = function() {
      $scope.email = null;
      $scope.contactName = null;
      $scope.message = null;
      $scope.contactForm.$setPristine();
    };

  });

})();
