"use strict";
// Hack: angular should be at the top of the file because templates.js do not use require('angular')
var angular = require("angular");
var templates = angular.module('templates', []).name;
require("./templates.js");
var ryan_validator_1 = require("./ryan-validator");
var uib = require('angular-ui-bootstrap');
var animate = require('angular-animate');
var app = angular.module('aspnet', [templates, ryan_validator_1.default, uib, animate]);
//# sourceMappingURL=aspnet-angular.js.map