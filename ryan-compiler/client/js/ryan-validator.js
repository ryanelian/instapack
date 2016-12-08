"use strict";
var angular = require("angular");
var angularMessages = require('angular-messages');
var validator = angular.module('ryan-angular-validator', [angularMessages]);
var validatorController = [function () {
        var me = this;
        me.display = me.input.$name;
        me.minDesc = 'input value needs to be higher';
        me.maxDesc = 'input value needs to be lower';
        me.minLengthDesc = 'input length needs to be longer';
        me.maxLengthDesc = 'input length needs to be shorter';
        if (!me.mismatch) {
            me.mismatch = 'input pattern mismatched.';
        }
        if (!me.inputId)
            return;
        var control = window.document.getElementById(me.inputId);
        if (!control)
            return;
        var title = control.getAttribute('title');
        if (title)
            me.display = title;
        var min = control.getAttribute('min');
        if (min)
            me.minDesc = 'minimum input value is ' + min;
        var max = control.getAttribute('max');
        if (max)
            me.maxDesc = 'maximum input value is ' + max;
        var minlength = control.getAttribute('minlength');
        if (minlength)
            me.minLengthDesc = 'minimum input length is ' + minlength + ' characters';
        var maxlength = control.getAttribute('maxlength');
        if (maxlength)
            me.maxLengthDesc = 'maximum input length is ' + maxlength + ' characters';
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (validator.name);
//# sourceMappingURL=ryan-validator.js.map