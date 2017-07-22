import 'bootstrap.native';
import './angular-project';
import { ValidationService } from 'aspnet-validation';

let v = new ValidationService();
v.bootstrap();
