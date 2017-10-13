import Vue from 'vue';
import moment from 'moment';
import { VueSelect } from 'vue-select';
import VeeValidate from 'vee-validate';
import * as Components from './components';

// components and filters must be registered BEFORE the app root declaration
Vue.filter('tolocaltime', function (utcDateTime: string) {
    return moment.utc(utcDateTime).local().format('ddd, DD MMM YYYY, HH:mm');
});

Vue.component('v-select', VueSelect);
Vue.use(VeeValidate, {
    classes: true
});

Vue.component('hello', Components.Hello);

// bootstrap the Vue app from the root element <div id="app"></div>
new Vue().$mount('#app');
