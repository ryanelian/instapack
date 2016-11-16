import * as angular from 'angular';

let angularMessages : string = require('angular-messages');
let validator = angular.module('ryan-angular-validator', [angularMessages]);

let validatorController = [function () {
    let me = this;
    me.display = me.input.$name;
    me.minDesc = 'input value needs to be higher';
    me.maxDesc = 'input value needs to be lower';
    me.minLengthDesc = 'input length needs to be longer';
    me.maxLengthDesc = 'input length needs to be shorter';

    if (!me.mismatch) {
        me.mismatch = 'input pattern mismatched.';
    }

    if (!me.inputId) return;
    let control = window.document.getElementById(me.inputId);
    if (!control) return;

    let title = control.getAttribute('title');
    if (title) me.display = title;

    let min = control.getAttribute('min');
    if (min) me.minDesc = 'minimum input value is ' + min;

    let max = control.getAttribute('max');
    if (max) me.maxDesc = 'maximum input value is ' + max;

    let minlength = control.getAttribute('minlength');
    if (minlength) me.minLengthDesc = 'minimum input length is ' + minlength + ' characters';

    let maxlength = control.getAttribute('maxlength');
    if (maxlength) me.maxLengthDesc = 'maximum input length is ' + maxlength + ' characters';
}];

validator.component('validationMessage', {
    templateUrl: 'validationMessage.html',
    bindings: {
        input: '=',
        inputId: '@',
        mismatch: '@'
    },
    controller: validatorController,
    controllerAs: 'me'
});

export default (validator.name);
