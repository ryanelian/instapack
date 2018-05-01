export class SampleService {
    static $inject = ['$http'];

    $http: angular.IHttpService;

    constructor($http) {
        this.$http = $http;
    }

    hello(name: string) {
        return this.$http.post('/api/v1/hello', {
            message: 'Hello ' + name
        });
    }
}
