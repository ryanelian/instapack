import * as angular from 'angular';
import * as angularMessages from 'angular-messages';

let ryanValidator = angular.module('ryan-angular-validator', [angularMessages]);

class ValidatorController implements angular.IController {
    title: string;
    minDesc: string;
    maxDesc: string;
    minLengthDesc: string;
    maxLengthDesc: string;
    mismatch: string;
    input: angular.IFormController;

    constructor() {
    }

    public $onInit() {
        let control = window.document.getElementsByName(this.input.$name)[0];

        this.SetFieldTitle();
        this.SetMinErrorMessage(control);
        this.SetMaxErrorMessage(control);
        this.SetMinLengthErrorMessage(control);
        this.SetMaxLengthErrorMessage(control);
        this.SetPatternMismatchMessage();
    }

    public SetFieldTitle() {
        if (!this.title) {
            this.title = this.input.$name;
        }
    }

    public SetMinErrorMessage(control: HTMLElement) {
        this.minDesc = 'input value needs to be higher';

        if (control) {
            let min = control.getAttribute('min') || control.getAttribute('ng-min');
            if (min) {
                this.minDesc = 'minimum input value is ' + min;
            }
        }
    }

    public SetMaxErrorMessage(control: HTMLElement) {
        this.maxDesc = 'input value needs to be lower';

        if (control) {
            let max = control.getAttribute('max') || control.getAttribute('ng-max');
            if (max) {
                this.maxDesc = 'maximum input value is ' + max;
            }
        }
    }

    public SetMinLengthErrorMessage(control: HTMLElement) {
        this.minLengthDesc = 'input length needs to be longer';

        if (control) {
            let minlength = control.getAttribute('minlength') || control.getAttribute('ng-minlength');
            if (minlength) {
                this.minLengthDesc = 'minimum input length is ' + minlength + ' characters';
            }
        }
    }

    public SetMaxLengthErrorMessage(control: HTMLElement) {
        this.maxLengthDesc = 'input length needs to be shorter';

        if (control) {
            let maxlength = control.getAttribute('maxlength') || control.getAttribute('ng-maxlength');
            if (maxlength) {
                this.maxLengthDesc = 'maximum input length is ' + maxlength + ' characters';
            }
        }
    }

    public SetPatternMismatchMessage() {
        if (!this.mismatch) {
            this.mismatch = 'input pattern mismatched.';
        }
    }
}

class ValidatorComponent implements angular.IComponentOptions {
    public template: string = require('./validationMessage.html');
    public bindings = {
        input: '=',
        title: '@',
        mismatch: '@'
    };
    public controller = [ValidatorController];
    public controllerAs = 'me';
}

ryanValidator.component('validationMessage', new ValidatorComponent());
export default (ryanValidator.name);
