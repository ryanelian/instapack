import 'ts-polyfill/lib/es2016-array-include';
import 'ts-polyfill/lib/es2017-object';
import 'ts-polyfill/lib/es2017-string';
import 'ts-polyfill/lib/es2017-async-iterable';   // for-await-of
import 'ts-polyfill/lib/es2018-promise';
import 'ts-polyfill/lib/es2019-array';
import 'ts-polyfill/lib/es2019-string';
import 'ts-polyfill/lib/es2019-symbol';

import ons from 'onsenui';

if (ons.platform.isIPhoneX()) {
    // https://onsen.io/v2/guide/iphonex.html#iphone-x
    document.documentElement.setAttribute('onsflag-iphonex-portrait', '');
    document.documentElement.setAttribute('onsflag-iphonex-landscape', '');
}

import './vue-project';
