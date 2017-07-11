import * as angular from 'angular';

// angular-messages is needed by Validation Message component.
// angular-animate is needed by Angular UI Bootstrap.
import * as animate from 'angular-animate';
import * as messages from 'angular-messages';
import * as uib from 'angular-ui-bootstrap';

import * as components from './components';
import * as services from './services';

let app = angular.module('aspnet', [uib, animate, messages]);

app.run(['$window', '$q', ($window: angular.IWindowService, $q: angular.IQService) => {
    // $q is a Promises/A+-compliant implementation of deferred objects.
    // Now we can use TypeScript async-await on $q promises and make it work with AngularJS world!
    $window['Promise'] = $q;
}]);

app.component('validationMessage', components.ValidationMessageComponent);
