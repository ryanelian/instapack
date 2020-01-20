import { BuildVariables } from './variables-factory/BuildVariables';

export interface BuildWorkerParameters {
    build: 'js' | 'type-check' | 'css' | 'copy';
    variables: BuildVariables;
}
