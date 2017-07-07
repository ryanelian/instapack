class HomeController implements angular.IController {
    static $inject = [];

    constructor(){
    }

    $onInit() {
    }
}

export let HomeComponent: angular.IComponentOptions = {
    template: require('./Home.html'),
    controller: HomeController,
    controllerAs: 'me'
};
