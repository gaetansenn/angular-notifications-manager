'use strict';

describe('', function() {

  var module;
  var dependencies;
  dependencies = [];

  var hasModule = function(module) {
  return dependencies.indexOf(module) >= 0;
  };

  beforeEach(function() {

  // Get module
  module = angular.module('angularNotificationsManager');
  dependencies = module.requires;
  });

  it('should load config module', function() {
    expect(hasModule('angularNotificationsManager.config')).to.be.ok;
  });

  

  

  
  it('should load services module', function() {
    expect(hasModule('angularNotificationsManager.services')).to.be.ok;
  });
  

});