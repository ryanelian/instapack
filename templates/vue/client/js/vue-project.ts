import Vue from 'vue';
import BootstrapVue from 'bootstrap-vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { ValidationProvider, ValidationObserver } from 'vee-validate';
import HelloWorld from './components/HelloWorld.vue';

Vue.use(BootstrapVue);
Vue.component('validation-provider', ValidationProvider);
Vue.component('validation-observer', ValidationObserver);
Vue.component('fa-icon', FontAwesomeIcon);

// components must be registered BEFORE the app root declaration
Vue.component('hello-world', HelloWorld);

// bootstrap the Vue app from the root element <div id="app"></div>
new Vue().$mount('#app');
