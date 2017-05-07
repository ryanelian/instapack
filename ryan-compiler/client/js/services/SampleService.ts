import * as models from '../models';

export class SampleService {
    static $inject = ['$http'];

    $http: angular.IHttpService;

    constructor($http){
        this.$http = $http;
    }

    Hello() {
        return this.$http.post<models.SampleModel>('/api/v1/hello', {
            message: 'Hello World'
        });
    }
}
