import { BuildWorkerParameters } from './BuildWorkerParameters';
import { BuildVariables } from './variables-factory/BuildVariables';
import { fork, ChildProcess } from 'child_process';

export class BuildWorkerManager {

    workers: ChildProcess[] = [];

    run(param: BuildWorkerParameters): void {
        const cp = fork(require.resolve('./BuildWorker'));
        cp.send(param);
        this.workers.push(cp);
    }

    terminateAll(): void {
        for (const w of this.workers) {
            w.kill();
        }
    }

    runJsBuildWorker(variables: BuildVariables): void {
        this.run({
            build: 'js',
            variables: variables
        });
    }

    runTypeCheckBuildWorker(variables: BuildVariables): void {
        this.run({
            build: 'type-check',
            variables: variables
        });
    }

    runCssBuildWorker(variables: BuildVariables): void {
        this.run({
            build: 'css',
            variables: variables
        });
    }

    runCopyBuildWorker(variables: BuildVariables): void {
        this.run({
            build: 'copy',
            variables: variables
        });
    }
}