import 'ts-polyfill';
import 'bootstrap';

import { ValidationService } from 'aspnet-validation';
import './icons';
import './vue-project';

new ValidationService().bootstrap();
