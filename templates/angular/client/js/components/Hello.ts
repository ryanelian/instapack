import { Component, Input } from '@angular/core';

let template: string = require('./Hello.html');

@Component({
    selector: 'hello',
    template: template
})
export class Hello {
    @Input() compiler: string;
    @Input() framework: string;
}
