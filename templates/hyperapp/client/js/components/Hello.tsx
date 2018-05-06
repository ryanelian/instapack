import { h } from 'hyperapp';

interface HelloProps {
    compiler: string;
    framework: string;
}

export let Hello = ({ framework, compiler }: HelloProps) => (
    <h1>Hello from {compiler} and {framework}!</h1>
);
