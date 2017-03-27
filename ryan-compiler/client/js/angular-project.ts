import * as angular from 'angular';
import * as animate from 'angular-animate';
import * as messages from 'angular-messages';
import * as uib from 'angular-ui-bootstrap';

import * as components from './components';
import * as services from './services';

let app = angular.module('aspnet', [uib, animate, messages]);
app.component('validationMessage', new components.ValidatorComponent());
