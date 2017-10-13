import angular from 'angular';

// angular-material dependencies
import animate from 'angular-animate';
import aria from 'angular-aria';
import messages from 'angular-messages';
import sanitize from 'angular-sanitize';

import material from 'angular-material';
import router from '@uirouter/angularjs';
import { StateProvider, UrlRouterProvider } from '@uirouter/angularjs';

import * as Components from './components';
import * as Services from './services';
import * as States from './states';

let app = angular.module('aspnet', [animate, aria, messages, sanitize, material, router]);

app.run(['$q', ($q: angular.IQService) => {
    window['Promise'] = $q;
}]);

app.component('validationMessage', Components.ValidationMessageComponent);
app.component('home', Components.HomeComponent);
app.component('hello', Components.HelloComponent);

app.config(['$stateProvider', '$urlRouterProvider', (routing: StateProvider, url: UrlRouterProvider) => {
    url.otherwise('/');
    routing.state(States.Home);
    routing.state(States.Hello);
}]);
