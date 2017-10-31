"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Events = require("events");
class EventHub extends Events {
    buildDone() {
        this.emit('build-done');
    }
    exitOnBuildDone() {
        this.on('build-done', () => {
            process.exit(0);
        });
    }
}
exports.EventHub = EventHub;
let hub = new EventHub();
exports.default = hub;
