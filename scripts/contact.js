
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

  app.directive('showErrors', [function() {
    return {
      restrict: "A",
      link: function(scope, element, attrs, ctrl) {
        var input = angular.element(element[0].querySelector('input[ng-model],textarea[ng-model]'));

        if (input) {
          scope.$watch(function() {
            return input.hasClass('ng-invalid');
          }, function(isInvalid) {
            element.toggleClass('has-error', isInvalid);
          });
        }

      }
    };
  }]);

})();
