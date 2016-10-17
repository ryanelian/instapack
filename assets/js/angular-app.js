'use strict';

// Hack: "var angular" should be at the top of the file because templates.js do not use require('angular')
var angular = require('angular');

var templates = angular.module('templates', []).name;
require('./templates');

var ryanValidator = require('./ryan-angular-validator');
var uib = require('angular-ui-bootstrap');
var animate = require('angular-animate');

var app = angular.module('aspnet', [templates, ryanValidator, uib, animate]);
