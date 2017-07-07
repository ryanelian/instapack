import { Ng1StateDeclaration as State, StateParams } from '@uirouter/angularjs';

export let Home: State = {
    name: 'home',
    url: '/',
    component: 'home'
};

export let Hello: State = {
    name: 'hello',
    url: '/hello/{name}',
    component: 'hello',
    resolve: {
        name: ['$stateParams', function (params: StateParams) {
            return params['name'];
        }]
    }
};
