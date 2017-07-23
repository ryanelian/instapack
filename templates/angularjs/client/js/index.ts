import './angular-project';
import { ValidationService } from 'aspnet-validation';
import * as Bootstrap from 'bootstrap.native';

let v = new ValidationService();
v.bootstrap();
