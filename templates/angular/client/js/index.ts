import 'ts-polyfill';
import 'zone.js/dist/zone';
import 'web-animations-js';

if (process.env.ENV === 'production') {
    // Production
} else {
    // Development and test
    Error['stackTraceLimit'] = Infinity;
    require('zone.js/dist/long-stack-trace-zone');
}

import './icons';
import './angular-project';
