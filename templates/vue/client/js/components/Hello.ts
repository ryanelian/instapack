import Vue from 'vue';
import Component from 'vue-class-component';

@Component({
    template: require('./Hello.html') as string,
    props: ['framework', 'compiler']
})
export class Hello extends Vue {
    framework: string;
    compiler: string;
}
