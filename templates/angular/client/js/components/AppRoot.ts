import { Component } from '@angular/core';

let template: string = require('./AppRoot.html');

@Component({
    selector: 'app-root',
    template: template
})
export class AppRoot {
    framework: string = 'Angular';
    compiler: string = 'instapack';
}
