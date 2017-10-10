import * as angular from 'angular';

// angular-material dependencies
import * as animate from 'angular-animate';
import * as aria from 'angular-aria';
import * as messages from 'angular-messages';
import * as sanitize from 'angular-sanitize';

import * as material from 'angular-material';
import * as router from '@uirouter/angularjs';

import * as Components from './components';
import * as Services from './services';
import * as States from './states';

let app = angular.module('aspnet', [animate, aria, messages, sanitize, material, router.default]);

app.run(['$q', ($q: angular.IQService) => {
    window['Promise'] = $q;
}]);

app.component('validationMessage', Components.ValidationMessageComponent);
app.component('home', Components.HomeComponent);
app.component('hello', Components.HelloComponent);

app.config(['$stateProvider', '$urlRouterProvider', (routing: router.StateProvider, url: router.UrlRouterProvider) => {
    url.otherwise('/');
    routing.state(States.Home);
    routing.state(States.Hello);
}]);
