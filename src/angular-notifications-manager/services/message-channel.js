(function (angular) {
  angular
    .module('angularNotificationsManager.services')
    .provider('MessageChannel', MessageChannelProvider);

  /* @ngInject */
  function MessageChannelProvider() {
    /* jshint validthis: true */
    var serviceName = 'SocketIO';
    //Should pass the name of the dependency to inject.
    //The service must expose the following functions :
    // on, isConnected, emit

    this.setService = function set(name) {
      serviceName = name;
    };

    this.$get = MessageChannel;

    MessageChannel.$inject = ['$injector'];
    function MessageChannel($injector) {
      return $injector.get(serviceName);
    }
  }
})(angular);
