import * as ES6Promise from 'es6-promise';
import { ValidationService } from 'aspnet-validation';
import 'bootstrap.native';

ES6Promise.polyfill();

let v = new ValidationService();
v.bootstrap();
