import Vue from 'vue';
import { Hello } from './components/Hello';

// components must be registered BEFORE the app root declaration
Vue.component('hello', Hello);

// bootstrap the Vue app from the root element <div id="app"></div>
new Vue().$mount('#app');
