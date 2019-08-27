import Vue from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { ValidationProvider, ValidationObserver } from 'vee-validate';
import Hello from './components/Hello.vue';

Vue.component('ValidationProvider', ValidationProvider);
Vue.component('ValidationObserver', ValidationObserver);
Vue.component('fa', FontAwesomeIcon);

// components must be registered BEFORE the app root declaration
Vue.component('hello', Hello);

// bootstrap the Vue app from the root element <div id="app"></div>
new Vue().$mount('#app');
