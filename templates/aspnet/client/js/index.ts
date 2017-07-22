import 'bootstrap.native';
import * as ES6Promise from 'es6-promise';
import { ValidationService } from 'aspnet-validation';

ES6Promise.polyfill();

let v = new ValidationService();
v.bootstrap();
