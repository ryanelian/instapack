'use strict';

require('./aspnet-validation');

// Sanity checking Angular compilation. Comment out if you do not need Angular.
var angular = require('angular');

angular.module('templates', []);
require('./templates');

angular.module('aspnet', ['templates']);
require('./components/calculator');
