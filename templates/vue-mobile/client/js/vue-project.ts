import Vue from 'vue';
import VueOnsen from 'vue-onsenui';
import { Root } from './components/Root';

Vue.use(VueOnsen);

// bootstrap the Vue app from the root element <div id="app"></div>
new Root().$mount('#app');
