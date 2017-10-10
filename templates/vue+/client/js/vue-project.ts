import * as Vue from 'vue';
import * as moment from 'moment';
import VueSelect = require('vue-select');
import VeeValidate = require('vee-validate');
import * as Components from './components';

// components and filters must be registered BEFORE the app root declaration
Vue.filter('tolocal', function (utcDateTime: string) {
    return moment.utc(utcDateTime).local().format('ddd, DD MMM YYYY, HH:mm');
});

Vue.component('v-select', VueSelect.VueSelect);
Vue.use(VeeValidate, {
    classes: true
});

Vue.component('hello', Components.Hello);

// bootstrap the Vue app from the root element <div id="app"></div>
new Vue().$mount('#app');
