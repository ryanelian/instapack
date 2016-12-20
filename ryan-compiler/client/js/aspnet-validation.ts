// Hack: ASP.NET Core MVC JQuery Validation Unobtrusive requires that jQuery is defined globally!
import * as $ from 'jquery';
window['$'] = window['jQuery'] = $;

// Hack: currently jquery-validation version higher than 1.15.0 breaks Browserify!
import 'jquery-validation';
import 'jquery-validation-unobtrusive';

// Bonus: Enables JavaScript-enabled Bootstrap components
import 'bootstrap-sass/assets/javascripts/bootstrap';
