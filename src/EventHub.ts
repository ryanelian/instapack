import * as Events from 'events';

export class EventHub extends Events {
    buildDone() {
        this.emit('build-done');
    }

    exitOnBuildDone() {
        this.on('build-done', () => {
            process.exit(0);
        });
    }
}

let hub = new EventHub();
export default hub;
