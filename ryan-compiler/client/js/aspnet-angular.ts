import * as angular from 'angular';
import ryanValidator from './ryan-validator';
import * as uib from 'angular-ui-bootstrap';
import * as animate from 'angular-animate';

let app = angular.module('aspnet', [ryanValidator, uib, animate]);
