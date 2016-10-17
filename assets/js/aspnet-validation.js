'use strict';

// Hack: jquery.validate.unobtrusive requires that jQuery is defined globally!
window.jQuery = require('jquery');

// Hack: currently jquery-validation version higher than 1.15.0 breaks Browserify!
require('jquery-validation');

require('jquery-validation-unobtrusive');
