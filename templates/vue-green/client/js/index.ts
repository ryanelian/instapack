import 'ts-polyfill/lib/es2017-string';
import 'ts-polyfill/lib/es2017-object';
import 'ts-polyfill/lib/es2018-promise';

import 'bootstrap';
import './icons';
import './vue-project';
import { ValidationService } from 'aspnet-validation';

new ValidationService().bootstrap();
