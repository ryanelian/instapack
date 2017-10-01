import * as Vue from 'vue';

import * as Components from './components';

// components must be registered BEFORE the app root declaration
Vue.component('hello', Components.HelloWorld);

// bootstrap the Vue app from the root element <div id="app"></div>
new Vue().$mount('#app');
