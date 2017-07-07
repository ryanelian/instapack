import { StateService } from '@uirouter/angularjs';

class HomeController implements angular.IController {
    static $inject = ['$state'];

    $state: StateService;
    name: string;

    constructor($state) {
        this.$state = $state;
    }

    $onInit() {
    }

    submit() {
        this.$state.go('hello', {
            name: this.name
        });
    }
}

export let HomeComponent: angular.IComponentOptions = {
    template: require('./Home.html'),
    controller: HomeController,
    controllerAs: 'me'
};
