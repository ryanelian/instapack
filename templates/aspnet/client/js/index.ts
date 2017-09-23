import * as ES6Promise from 'es6-promise';
import { ValidationService } from 'aspnet-validation';
import 'bootstrap.native/dist/bootstrap-native-v4';

ES6Promise.polyfill();

let v = new ValidationService();
v.bootstrap();
