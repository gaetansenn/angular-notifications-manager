(function (angular) {

  // Create all modules and define dependencies to make sure they exist
  // and are loaded in the correct order to satisfy dependency injection
  // before all nested files are concatenated by Gulp

  // Modules
  angular.module('angularSocketIO.services', []);
  angular.module('angularSocketIO',
    [
      'angularSocketIO.services'
    ]);

})(angular);
