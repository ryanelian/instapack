"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildWorkerManager = void 0;
const child_process_1 = require("child_process");
class BuildWorkerManager {
    constructor() {
        this.workers = [];
    }
    run(param) {
        const cp = child_process_1.fork(require.resolve('./BuildWorker'));
        cp.send(param);
        this.workers.push(cp);
    }
    terminateAll() {
        for (const w of this.workers) {
            w.kill();
        }
    }
    runJsBuildWorker(variables) {
        this.run({
            build: 'js',
            variables: variables
        });
    }
    runTypeCheckBuildWorker(variables) {
        this.run({
            build: 'type-check',
            variables: variables
        });
    }
    runCssBuildWorker(variables) {
        this.run({
            build: 'css',
            variables: variables
        });
    }
    runCopyBuildWorker(variables) {
        this.run({
            build: 'copy',
            variables: variables
        });
    }
}
exports.BuildWorkerManager = BuildWorkerManager;
