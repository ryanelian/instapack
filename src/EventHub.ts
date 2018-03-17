import * as Events from 'events';

/**
 * Hosts centralized communication methods for current process.
 */
export class EventHub extends Events {
    /**
     * Emits `build-done` event to the hub.
     */
    buildDone() {
        this.emit('build-done');
    }

    /**
     * To be used by build jobs / child processes during non-watch mode.
     * Kills itself after build is completed.
     */
    exitOnBuildDone() {
        this.on('build-done', () => {
            // console.log('SUICIDE');
            process.exit(0);
        });
    }
}

let hub = new EventHub();
export default hub;
