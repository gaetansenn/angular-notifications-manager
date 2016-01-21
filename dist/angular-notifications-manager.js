(function (angular) {

  // Create all modules and define dependencies to make sure they exist
  // and are loaded in the correct order to satisfy dependency injection
  // before all nested files are concatenated by Gulp

  // Config
  angular.module('angularNotificationsManager.config', [])
    .value('angularNotificationsManager.config', {
      debug: true
    });

  // Modules
  angular.module('angularNotificationsManager.services', []);
  angular.module('angularNotificationsManager',
    [
      'angularNotificationsManager.config',
      'angularNotificationsManager.services',
      'angularSocketIO'
    ]);

})(angular);

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

(function (angular) {
  angular
    .module('angularNotificationsManager.services')
    .provider('NotificationsManager', NotificationsManagerProvider);
  function NotificationsManagerProvider() {
    var configuration = {
      identifier: '_id',
      separator: ':'
    };

    //Notification object model
    //{
    //  "type": "(require)",
    //  "action": "(optional)",
    //  "listeners": [
    //  {
    //    "callback": "(function)",
    //    "options": "(middleware of option available from the library"
    //  }
    //]
    //}
    var notifications = [];

    this.setBaseUrl = function (url) {
      if (url) configuration.baseUrl = url;
    };

    this.setViewUrl = function (url) {
      if (url) configuration.viewUrl = url;
    };

    this.setPrefix = function (prefix) {
      if (prefix) configuration.prefix = prefix;
    };

    this.setSeparator = function (separator) {
      if (separator) configuration.separator = separator;
    };

    this.setIdentifier = function (identifier) {
      if (identifier) configuration.identifier = identifier;
    };

    function checkConfiguration() {
      var requiredFields = ['baseUrl', 'viewUrl'];

      for (var i = 0; i < requiredFields.length; i++) {
        if (!configuration[requiredFields[i]]) throw new Error('NotificationsManagerProvider:configuration, the field ' + requiredFields[i] + ' is required');
      }
    }

    this.$get = NotificationManager;

    NotificationManager.$inject = ['$injector', '$log', 'MessageChannel'];
    function NotificationManager($injector, $log, MessageChannel) {
      var features = [{
        name: 'grouped',
        function: group
      }, {
        name: 'viewed',
        function: view
      }];

      var initOptions = [{
        name: 'fetchOnInit',
        function: fetch
      }];

      return {
        //Load a notification
        on: on,
        view: function (notification) {
          view(notification, true);
        },
        refresh: function () {
          for (var i = 0; i < notifications.length; i++) {
            for (var j = 0; j < notifications[i].listeners.length; j++) {
              bindNotification(notifications[i].type, notifications[i].action, notifications[i].listeners[j].options, notifications[i].listeners[j].callback);
            }
          }
        }
      };

      //Bind Message channel to specific type and action using the MessageChannel listener
      function bindMessageChannel(type, action, callback) {
        var query = (configuration.prefix) ? configuration.prefix + configuration.separator : '';
        query += type;

        if (action) query += configuration.separator + action;

        MessageChannel.on(query, function (response) {
          callback(response);
        });
      }

      //view a specific notification
      function view(data, active) {
        if (active) {
          if (!configuration.identifier) return $log.info('NotificationsManager:view, unable to find the identifier ' + configuration.identifier + ' from the notification model');

          $injector.get('$http').put(configuration.viewUrl, {
            id: data[configuration.identifier]
          });
        }
      }

      function group(data, active, callback) {
        if (!active && angular.isArray(data)) {
          for (var i = 0; i < data.length; i++) {
            callback(data[i]);
          }
          return false;
        }
        return callback(data);
      }

      //Merge object2 into object1
      function merge(object1, object2) {
        for (var key in object2) {
          if (!object2.hasOwnProperty(key)) continue;
          if (!object1[key]) object1[key] = object2[key];
        }
        return object1;
      }

      //Check if an object is empty
      function isEmpty(object) {
        for (var prop in object) {
          if (object.hasOwnProperty(prop)) return false;
        }

        return true;
      }

      //This function will fetch all notification not viewed
      function fetch(active, callback, options, type, action) {
        var params = (action) ? {action: action} : {};
        merge(params, active);
        if (active) {
          $injector.get('$http').get(configuration.baseUrl + '/' + type, {
            params: params
          }).then(function (response) {
            handleDataFromOptions(response.data, type, action, options, callback);
          });
        }
      }

      //Handle options
      function handleDataFromOptions(data, type, action, options, callback) {
        if (isEmpty(options)) return callback(data);
        for (var i = 0; i < features.length; i++) {
          //We don't wait for async actions to be resolved
          features[i].function(data, options[features[i].name], callback, type, action);
        }
      }

      //Handle Init Options
      function handleInitOptions(type, action, options, callback) {
        if (isEmpty(options)) return false;
        for (var i = 0; i < initOptions.length; i++) {
          initOptions[i].function(options[initOptions[i].name], callback, options, type, action);
        }
      }

      //Push new notifications and also set notification to view if option view is set to true.
      function bindNotification(type, action, options, callback) {
        var bind = function () {
          handleInitOptions(type, action, options, callback);
          bindMessageChannel(type, action, function (response) {
            var notificationObject = find(type, action);
            if (!notificationObject) return false;
            for (var i = 0; i < notificationObject.listeners.length; i++) {
              handleDataFromOptions(response, type, action, notificationObject.listeners[i].options, notificationObject.listeners[i].callback);
            }
          });
        };

        if (MessageChannel.isConnected()) {
          bind();
        } else {
          //We are waiting for a connected status
          MessageChannel.on('connect', function () {
            bind();
          });
        }
      }

      function find(type, action) {
        for (var i = 0; i < notifications.length; i++) {
          if (notifications[i].type === type && !action && !notifications[i].action) return notifications[i];
          if (notifications[i].type === type && action && notifications[i].action === action) return notifications[i];
        }
        return undefined;
      }

      function add(type, action, options, callback) {
        var notificationObject = find(type, action);
        if (notificationObject) {
          notificationObject.listeners.push({
            callback: callback,
            options: options
          });
        } else {
          notifications.push({
            type: type,
            action: action,
            listeners: [{
              callback: callback,
              options: options
            }]
          });
          bindNotification(type, action, options, callback);
        }
      }

      function on(type, action, options, callback) {
        checkConfiguration();
        add(type, action, options, callback);
      }
    }
  }
})(angular);

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
