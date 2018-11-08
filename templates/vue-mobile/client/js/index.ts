import 'ts-polyfill/lib/es2017-string';
import 'ts-polyfill/lib/es2017-object';
import 'ts-polyfill/lib/es2018-promise';

import ons from 'onsenui';

if (ons.platform.isIPhoneX()) {
    // https://onsen.io/v2/guide/iphonex.html#iphone-x
    document.documentElement.setAttribute('onsflag-iphonex-portrait', '');
    document.documentElement.setAttribute('onsflag-iphonex-landscape', '');
}

import './vue-project';
