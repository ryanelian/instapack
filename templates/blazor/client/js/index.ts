import 'ts-polyfill/lib/es2016-array-include';
import 'ts-polyfill/lib/es2017-object';
import 'ts-polyfill/lib/es2017-string';
import 'ts-polyfill/lib/es2018-async-iterable';   // for-await-of
import 'ts-polyfill/lib/es2018-promise';
import 'ts-polyfill/lib/es2019-array';
import 'ts-polyfill/lib/es2019-object';
import 'ts-polyfill/lib/es2019-string';
import 'ts-polyfill/lib/es2020-string';

import 'bootstrap';

// re-export all modules to global namespace object
// (window[namespace]) by default: window['instapack']
// namespace name can be set at package.json:instapack:namespace
export * from './blazor-interop';
