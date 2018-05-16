import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { } from '@angular/material';
import { AppRoot } from './components/AppRoot';
import { Hello } from './components/Hello';

@NgModule({
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        FontAwesomeModule
    ],
    declarations: [
        AppRoot, Hello
    ],
    providers: [

    ],
    bootstrap: [
        AppRoot
    ]
})
export class AppModule { }
