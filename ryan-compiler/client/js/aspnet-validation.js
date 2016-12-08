"use strict";
// Hack: ASP.NET Core MVC JQuery Validation Unobtrusive requires that jQuery is defined globally!
var $ = require("jquery");
window['$'] = window['jQuery'] = $;
// Hack: currently jquery-validation version higher than 1.15.0 breaks Browserify!
require('jquery-validation');
require('jquery-validation-unobtrusive');
//# sourceMappingURL=aspnet-validation.js.map