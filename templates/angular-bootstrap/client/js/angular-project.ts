import * as angular from 'angular';

// angular-messages is needed by Validation Message component.
// angular-animate is needed by Angular UI Bootstrap.
import * as animate from 'angular-animate';
import * as messages from 'angular-messages';
import * as uib from 'angular-ui-bootstrap';

import * as Components from './components';
import * as Services from './services';

let app = angular.module('aspnet', [uib, animate, messages]);

app.run(['$q', ($q: angular.IQService) => {
    window['Promise'] = $q;
}]);

app.component('validationMessage', Components.ValidationMessageComponent);
