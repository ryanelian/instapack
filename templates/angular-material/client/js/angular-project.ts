import * as angular from 'angular';

// angular-material dependencies
import * as animate from 'angular-animate';
import * as aria from 'angular-aria';
import * as messages from 'angular-messages';
import * as sanitize from 'angular-sanitize';

import * as material from 'angular-material';
import * as router from '@uirouter/angularjs';

import * as components from './components';
import * as services from './services';
import * as states from './states';

let app = angular.module('aspnet', [animate, aria, messages, sanitize, material, router.default]);

app.run(['$window', '$q', ($window: angular.IWindowService, $q: angular.IQService) => {
    // $q is a Promises/A+-compliant implementation of deferred objects.
    // Now we can use TypeScript async-await on $q promises and make it work with AngularJS world!
    $window['Promise'] = $q;
}]);

app.component('validationMessage', components.ValidationMessageComponent);
app.component('home', components.HomeComponent);

app.config(['$stateProvider', '$urlRouterProvider', (routing: router.StateProvider, url: router.UrlRouterProvider) => {
    url.otherwise('/');
    routing.state(states.Home);
}]);
