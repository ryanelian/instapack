class ValidationMessageController implements angular.IController {
    static $inject = [];

    input: angular.IFormController;
    forId: string;
    display: string;
    element: HTMLElement;

    minError: string;
    maxError: string;
    minLengthError: string;
    maxLengthError: string;
    patternError: string;

    constructor() {
    }

    $onInit() {
        if (this.forId) {
            this.element = window.document.getElementById(this.forId);
        } else {
            this.element = window.document.getElementsByName(this.input.$name)[0];
        }

        this.setFieldDisplay();
        this.setMinErrorMessage();
        this.setMaxErrorMessage();
        this.setMinLengthErrorMessage();
        this.setMaxLengthErrorMessage();
        this.setPatternErrorMessage();
    }

    setFieldDisplay() {
        if (!this.display) {
            this.display = this.input.$name;
        }
    }

    setMinErrorMessage() {
        this.minError = 'input value needs to be higher';

        if (this.element) {
            let min = this.element.getAttribute('min') || this.element.getAttribute('ng-min');
            if (min) {
                this.minError = 'minimum input value is ' + min;
            }
        }
    }

    setMaxErrorMessage() {
        this.maxError = 'input value needs to be lower';

        if (this.element) {
            let max = this.element.getAttribute('max') || this.element.getAttribute('ng-max');
            if (max) {
                this.maxError = 'maximum input value is ' + max;
            }
        }
    }

    setMinLengthErrorMessage() {
        this.minLengthError = 'input length needs to be longer';

        if (this.element) {
            let minlength = this.element.getAttribute('minlength') || this.element.getAttribute('ng-minlength');
            if (minlength) {
                this.minLengthError = 'minimum input length is ' + minlength + ' characters';
            }
        }
    }

    setMaxLengthErrorMessage() {
        this.maxLengthError = 'input length needs to be shorter';

        if (this.element) {
            let maxlength = this.element.getAttribute('maxlength') || this.element.getAttribute('ng-maxlength');
            if (maxlength) {
                this.maxLengthError = 'maximum input length is ' + maxlength + ' characters';
            }
        }
    }

    setPatternErrorMessage() {
        if (!this.patternError) {
            this.patternError = this.display + ' field input pattern mismatched';

            if (this.element) {
                let regex = this.element.getAttribute('pattern');
                if (regex) {
                    this.patternError += ' ' + regex;
                }
            }
        }
    }
}

export let ValidationMessage: angular.IComponentOptions = {
    template: require('./ValidationMessage.html') as string,
    bindings: {
        input: '<for',
        forId: '@',
        display: '@',
        patternError: '@'
    },
    controller: ValidationMessageController,
    controllerAs: 'me'
};
