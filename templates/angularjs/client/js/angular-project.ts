import angular from 'angular';
import animate from 'angular-animate';
import touch from 'angular-touch';
import messages from 'angular-messages';
import uib from 'angular-ui-bootstrap';
// angular-animate and angular-touch are required by Angular UI Bootstrap.
// angular-messages is required by the Validation Message component.

import { ValidationMessage } from './components/ValidationMessage';
import { SampleService } from './services/SampleService';

let app = angular.module('aspnet', [uib, animate, touch, messages]);

app.run(['$q', ($q: angular.IQService) => {
    // Polyfill ES2018-compatible Promise using AngularJS implementation, which triggers $scope.$apply()
    window['Promise'] = $q;
}]);

app.component('validationMessage', ValidationMessage);
app.service('sampleService', SampleService);
