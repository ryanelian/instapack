import template from './ValidationMessage.html';

class ValidationMessageController implements angular.IController {
    input: angular.IFormController | undefined;
    forId: string | undefined;
    display: string | undefined;
    element: HTMLElement | undefined;

    minError = '';
    maxError = '';
    minLengthError = '';
    maxLengthError = '';
    patternError = '';

    static $inject = [];
    constructor() {
        // add dependency injection hints to $inject,
        // add dependency injection services as constructor parameter
    }

    $onInit(): void {
        if (this.forId) {
            const el = window.document.getElementById(this.forId);
            if (el) {
                this.element = el;
            }
        } else if (this.input && this.input.$name) {
            this.element = window.document.getElementsByName(this.input.$name)[0];
        }

        if (!this.element) {
            throw new Error('Form input element not found!');
        }

        this.setFieldDisplay();
        this.setMinErrorMessage();
        this.setMaxErrorMessage();
        this.setMinLengthErrorMessage();
        this.setMaxLengthErrorMessage();
        this.setPatternErrorMessage();
    }

    setFieldDisplay(): void {
        if (this.input && (this.display === undefined)) {
            this.display = this.input.$name;
        }
    }

    setMinErrorMessage(): void {
        this.minError = 'input value needs to be higher';

        if (this.element) {
            const min = this.element.getAttribute('min') || this.element.getAttribute('ng-min');
            if (min) {
                this.minError = 'minimum input value is ' + min;
            }
        }
    }

    setMaxErrorMessage(): void {
        this.maxError = 'input value needs to be lower';

        if (this.element) {
            const max = this.element.getAttribute('max') || this.element.getAttribute('ng-max');
            if (max) {
                this.maxError = 'maximum input value is ' + max;
            }
        }
    }

    setMinLengthErrorMessage(): void {
        this.minLengthError = 'input length needs to be longer';

        if (this.element) {
            const minlength = this.element.getAttribute('minlength') || this.element.getAttribute('ng-minlength');
            if (minlength) {
                this.minLengthError = 'minimum input length is ' + minlength + ' characters';
            }
        }
    }

    setMaxLengthErrorMessage(): void {
        this.maxLengthError = 'input length needs to be shorter';

        if (this.element) {
            const maxlength = this.element.getAttribute('maxlength') || this.element.getAttribute('ng-maxlength');
            if (maxlength) {
                this.maxLengthError = 'maximum input length is ' + maxlength + ' characters';
            }
        }
    }

    setPatternErrorMessage(): void {
        if (!this.patternError) {
            this.patternError = this.display + ' field input pattern mismatched';

            if (this.element) {
                const regex = this.element.getAttribute('pattern');
                if (regex) {
                    this.patternError += ' ' + regex;
                }
            }
        }
    }
}

export const ValidationMessage: angular.IComponentOptions = {
    template: template,
    bindings: {
        input: '<for',
        forId: '@',
        display: '@',
        patternError: '@'
    },
    controller: ValidationMessageController,
    controllerAs: 'me'
};
