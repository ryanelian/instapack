import Vue from 'vue';
import { renderAsyncComponent } from './vue-renderer';

import { defineRule, Form, Field } from 'vee-validate';
import AllRules from '@vee-validate/rules';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

// define validation rules
Object.keys(AllRules).forEach(rule => {
    defineRule(rule, AllRules[rule]);
});

/**
 * allows declaring components that can be used in all components.
 * usually these components are third-party libraries 
 * or any first-party reusable components such as a custom submit button.
 * @param app 
 */
function configure(app: Vue.App) {
    // https://v3.vuejs.org/style-guide/#component-name-casing-in-templates-strongly-recommended
    app.component('fa-icon', FontAwesomeIcon);
    app.component('vv-form', Form);
    app.component('vv-field', Field);
}

// use this file to render top-level components asynchronously. 

// for example: allows calling <Hello sdk="instapack" language="vue"></Hello> in HTML!
renderAsyncComponent('Hello', () => import('./components/Hello.vue'), configure);
