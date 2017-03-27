import * as angular from 'angular';

export class ValidatorController implements angular.IController {
    static $inject = [];

    title: string;
    minDesc: string;
    maxDesc: string;
    minLengthDesc: string;
    maxLengthDesc: string;
    mismatch: string;
    input: angular.IFormController;

    constructor() {
    }

    $onInit() {
        let control = window.document.getElementsByName(this.input.$name)[0];

        this.SetFieldTitle();
        this.SetMinErrorMessage(control);
        this.SetMaxErrorMessage(control);
        this.SetMinLengthErrorMessage(control);
        this.SetMaxLengthErrorMessage(control);
        this.SetPatternMismatchMessage();
    }

    SetFieldTitle() {
        if (!this.title) {
            this.title = this.input.$name;
        }
    }

    SetMinErrorMessage(control: HTMLElement) {
        this.minDesc = 'input value needs to be higher';

        if (control) {
            let min = control.getAttribute('min') || control.getAttribute('ng-min');
            if (min) {
                this.minDesc = 'minimum input value is ' + min;
            }
        }
    }

    SetMaxErrorMessage(control: HTMLElement) {
        this.maxDesc = 'input value needs to be lower';

        if (control) {
            let max = control.getAttribute('max') || control.getAttribute('ng-max');
            if (max) {
                this.maxDesc = 'maximum input value is ' + max;
            }
        }
    }

    SetMinLengthErrorMessage(control: HTMLElement) {
        this.minLengthDesc = 'input length needs to be longer';

        if (control) {
            let minlength = control.getAttribute('minlength') || control.getAttribute('ng-minlength');
            if (minlength) {
                this.minLengthDesc = 'minimum input length is ' + minlength + ' characters';
            }
        }
    }

    SetMaxLengthErrorMessage(control: HTMLElement) {
        this.maxLengthDesc = 'input length needs to be shorter';

        if (control) {
            let maxlength = control.getAttribute('maxlength') || control.getAttribute('ng-maxlength');
            if (maxlength) {
                this.maxLengthDesc = 'maximum input length is ' + maxlength + ' characters';
            }
        }
    }

    SetPatternMismatchMessage() {
        if (!this.mismatch) {
            this.mismatch = 'input pattern mismatched.';
        }
    }
}

export class ValidatorComponent implements angular.IComponentOptions {
    template: string = require('./validationMessage.html');
    bindings = {
        input: '=',
        title: '@',
        mismatch: '@'
    };
    controller = ValidatorController;
    controllerAs = 'me';
}
