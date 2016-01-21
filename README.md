AngularJS Notifications Manager
=============================

**Angular Notifications Manager** is an AngularJS library that allows you to manage your notifications connected with a message channel library (ex: Socket).

It provide a message channel service using socket.io-client.

### Current Version 0.1.0

# Demo
- Simple demo with a listener of new notification using the Websocket protocol. (available soon)

# Getting stated
Optionally: to install with bower, use:
```
bower install --save angular-notifications-manager
```

# Add AngularNotificationsManager

Add the module in your angular module.
```
angular.module('main', ['angularNotificationsManager']);
```

# Starter Guide
## Quick Configuration (For Lazy Readers)

This is all you need to start using all the notifications manager.

````javascript
//Add AngularNotificationsManager as a dependency to your app
angular.module('your-app', ['angularNotificationsManager']);

//Inject the NotificationsManager service into your controller
angular.module('your-app').controller('NotificationsManager', function($scope, NotificationsManager) {
  // ...
});
````

# How to configure them globally
 
## Properties

AngularNotificationsManager comes with default values but also required information that can be configured. We will use the provider to configure these properties.

### setBaseUrl

The base URL is used to fetch the notifications. For example if your URL for fetching notifications is http://example.com/api/notifications, then you will set the same value for the baseUrl.
This url is used when you want to active the fetchOnInit option to get all new notifications. (HTTP GET request)
````javascript
$http.get('http://example.com/api/notifications', function ...);
````

### setViewUrl

The view URL is used to alert the server that a notification has been read. This configuration is optional but require if you have activated the 'viewed' option.
For example you can have this kind of url : http://example.com/api/notifications as a PUT request. The parameters for this request will be in tht body with the identifier id.

````javascript
$http.put('http://example.com/api/notifications', { id: 12345 });
````

The identifier for a notification will be by default '_id' but can be configured with the setIdentifier

### setIdentifier

The set Identifier is used to configure which field the service will get to identify a specific notification. 
For instance if the API return this model for a specific notification :
````javascript
{
  _identifier: 12345,
  ...
}
````

Then we will call the setIdentifier like that :
````javascript
NotificationsManagerProvider.setIdentifier('_identifier');
````

### setPrefix

The prefix is used to identify the notifications in MessageChannel service. This is an optional parameters but could be useful if you are using the MessageChannel to transit another information.
For instance if we use the WebSocket protocol we can add the prefix 'notifications'
```
WebSocket.on('notifications:type:action', ...);
```

### setSeparator

The separator is used to separate the different parts that compose the event name used in the MessageChannel. As we explain before the AngularNotificationsManager will add the type and action (optional) to identify a new notification in the MessageChannel. To separate all those information we need to separate with a separator.
By default the separator ':' will be used.

#### Here a full example of configuration using the AngularNotificationsManagerProvider
````javascript
app.config(function(NotificationsManagerProvider) {
  NotificationsManagerProvider.setBaseUrl('http://example.com/api/notifications');
  NotificationsManagerProvider.setViewUrl('http://example.com/api/notifications/view');
  NotificationsManagerProvider.setIdentifier('_identifier'); // _id by default
  NotificationsManagerProvider.setPrefix('notifications');
  NotificationsManagerProvider.setSeparator(':'); // ':' by default
});
````

# Method description

AngularNotificationsManager is very simple to used. As we describe before a notification is composed of two fields :
  - The type : is used to identify a type of notification. Most of the time it will be the name used for the model in the database.
  - The action (optional) : is used to identify a particular action. Most of the time it will be the CRUD actions ('create', 'update', 'delete', 'read') but it could be anything
  
For example, if we have want to inform the user about something we can set the type as 'bookings' and the action could be what's happen with this booking. Example: 'notifications:bookings:create' will be a new notification to inform the user about a new booking.
````javascript
angular.module('your-app').controller('NotificationsManager', function($scope, NotificationsManager) {
  //Example without action. Can be used to display the number of notifications about the type bookings (header notifications).
  NotificationsManager.on('bookings', false, {}, function (notification) {
    ...
  });
  //Example with a type and action. Can be used to alert the user about a new notification.
  NotificationsManager.on('bookings', 'alert', {}, function (notification) {
    ...
  });
});
````

# Method Options

AngularNotificationsManager comes with different options.

## Properties

### fetchOnInit

The fetch on init is used to fetch all the notifications when the service is init. It will use the route setted at the configuration with the method 'setBaseUrl'.

The parameter will be an object composed of the fields (viewed, notViewed) :
````javascript
  fetchOnInit = {
    viewed: boolean,
    notViewed: boolean
  }
````

### grouped

The grouped options will return the notifications grouped. For instance if you activate the option fetchOnInit you will probably get all the information from the server as an array. But maybe you will want to get all those notification one by one.

### viewed

The viewed option is used to send a notification to the server that a specific notification has been received by the user. It will use the route setted at the configuration with the method 'setViewUrl'.
