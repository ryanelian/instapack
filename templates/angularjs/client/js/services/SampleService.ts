import { ISampleModel } from '../models/ISampleModel';

export class SampleService {
    static $inject = ['$http'];

    $http: angular.IHttpService;

    constructor($http) {
        this.$http = $http;
    }

    hello(name: string) {
        return this.$http.post<ISampleModel>('/api/v1/hello', {
            message: 'Hello ' + name
        });
    }
}
