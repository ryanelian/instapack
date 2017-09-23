import * as Vue from 'vue'
import Component from 'vue-class-component'
import * as Noty from 'noty';

@Component({
    template: require('./HelloWorld.html') as string
})
export class HelloWorld extends Vue {
    sayHello() {
        new Noty({
            text: 'Hello World!',
            type: 'info',
            timeout: 5000
        }).show();
    }
}
