(function (angular) {
  angular
    .module('angularSocketIO.services')
    .service('SocketIO', SocketIO);

  SocketIO.$inject = ["$rootScope"];
  function SocketIO($rootScope) {
    var socket = null;
    var requests = [];

    return {
      connect: connect,
      disconnect: function () {
        socket = null;
        requests = [];
      },
      on: on,
      get: function () {
        return socket;
      },
      isConnected: function () {
        return !!socket;
      },
      emit: function (eventName, data, callback) {
        socket.emit(eventName, data, function () {
          var args = arguments;
          $rootScope.$apply(function () {
            if (callback) {
              callback.apply(socket, args);
            }
          });
        });
      }
    };

    function on(eventName, callback) {
      if (socket && socket.on) {
        socket.on(eventName, function () {
          var args = arguments;
          $rootScope.$apply(function () {
            callback.apply(socket, args);
          });
        });
      } else {
        requests.push({
          eventName: eventName,
          callback: callback
        });
      }
    }

    function bindRequests() {
      for (var i = 0; i < requests.length; i++) {
        if (requests[i].eventName === 'connect') requests[i].callback();
        else on(requests[i].eventName, requests[i].callback);
      }
      requests = [];
    }

    function connect(url, params) {
      socket = io.connect(url, params);

      bindRequests();
    }
  }
})(angular);
