import angular from 'angular';

// angular-animate and angular-touch is required by Angular UI Bootstrap.
// angular-messages is required by Validation Message component.
import animate from 'angular-animate';
import touch from 'angular-touch';
import messages from 'angular-messages';
import uib from 'angular-ui-bootstrap';

import * as Components from './components';
import * as Services from './services';

let app = angular.module('aspnet', [uib, animate, touch, messages]);

app.run(['$q', ($q: angular.IQService) => {
    // Polyfill ES6 Promise using AngularJS implementation, which triggers $scope.$apply()
    window['Promise'] = $q;
}]);

app.component('validationMessage', Components.ValidationMessageComponent);
