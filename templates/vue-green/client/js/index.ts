import 'ts-polyfill';
import 'bootstrap';
import './icons';
import './vue-project';
import { ValidationService } from 'aspnet-validation';

new ValidationService().bootstrap();
