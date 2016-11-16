// Hack: angular should be at the top of the file because templates.js do not use require('angular')
import * as angular from 'angular';

let templates: string = angular.module('templates', []).name;
import './templates.js';
import ryanValidator from './ryan-validator';

let uib: string = require('angular-ui-bootstrap');
let animate: string = require('angular-animate');

let app = angular.module('aspnet', [templates, ryanValidator, uib, animate]);
