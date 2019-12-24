export class SampleService {

    $http: angular.IHttpService;

    static $inject = ['$http'];
    constructor($http: angular.IHttpService) {
        this.$http = $http;
    }

    hello(name: string): angular.IHttpPromise<object> {
        return this.$http.post<object>('/api/v1/hello', {
            message: 'Hello ' + name
        });
    }
}
