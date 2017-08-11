import * as angular from 'angular';

// angular-messages is needed by Validation Message component.
// angular-animate is needed by Angular UI Bootstrap.
import * as animate from 'angular-animate';
import * as messages from 'angular-messages';
import * as uib from 'angular-ui-bootstrap';

import * as components from './components';
import * as services from './services';

let app = angular.module('aspnet', [uib, animate, messages]);

app.run(['$q', ($q: angular.IQService) => {
    window['Promise'] = $q;
}]);

app.component('validationMessage', components.ValidationMessageComponent);
