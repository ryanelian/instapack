class HelloController implements angular.IController {
    static $inject = [];

    constructor() {
    }

    $onInit() {
    }
}

export let HelloComponent: angular.IComponentOptions = {
    template: require('./Hello.html'),
    controller: HelloController,
    controllerAs: 'me',
    bindings: {
        name: '<'
    }
};
